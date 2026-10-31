import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TabBar } from '../TabBar'

jest.mock('@utils/layout', () => ({ getMaxFontSizeMultiplier: () => 1.5 }), {
  virtual: true,
})
jest.mock('@theme/motion', () => ({ SPRING: { settle: {} } }), {
  virtual: true,
})
jest.mock('../PressableScale', () => ({ PressableScale: 'PressableScale' }))
// The node test runner cannot load react-native or Reanimated. Host
// components render as named elements so the test reads their props. A
// spring lands on its target at once.
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  useWindowDimensions: () => ({ width: 390, height: 844 }),
}))
jest.mock('react-native-reanimated', () => {
  const ReactActual = jest.requireActual('react')
  return {
    __esModule: true,
    default: { View: 'Animated.View' },
    useSharedValue: (initial: unknown) =>
      ReactActual.useState(() => {
        let value = initial
        return {
          get: () => value,
          set: (next: unknown) => {
            value = next
          },
        }
      })[0],
    useAnimatedStyle: (styleFn: () => object) => styleFn(),
    withSpring: (target: number) => target,
  }
})

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const options = [
  { title: 'QR', value: 'qr' },
  { title: 'Link', value: 'link' },
]

const render = (props: Partial<React.ComponentProps<typeof TabBar>> = {}) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <TabBar
        tabBarOptions={options}
        selectedValue="link"
        onItemSelected={jest.fn()}
        {...props}
      />,
    )
  })
  return renderer
}

const items = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType('PressableScale' as unknown as React.ElementType)

const label = (item: TestRenderer.ReactTestInstance) =>
  item.findByType('Text' as unknown as React.ElementType)

const layout = (
  item: TestRenderer.ReactTestInstance,
  rect: { x: number; width: number },
) =>
  act(() => {
    item.props.onLayout({
      nativeEvent: { layout: { ...rect, y: 0, height: 20 } },
    })
  })

const indicator = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root
    .findByType('Animated.View' as unknown as React.ElementType)
    .findByType('View' as unknown as React.ElementType)

describe('TabBar', () => {
  it('renders one item per option, the selected one in the foreground colour', () => {
    const [qr, link] = items(render())

    expect(label(qr).props.children).toBe('QR')
    expect(label(qr).props.className).toContain('text-muted-foreground')
    expect(label(link).props.children).toBe('Link')
    expect(label(link).props.className).toContain('text-foreground')
    expect(label(link).props.className).not.toContain('text-muted-foreground')
  })

  it('reports the pressed option value', () => {
    const onItemSelected = jest.fn()
    const [qr] = items(render({ onItemSelected }))

    act(() => {
      qr.props.onPress()
    })

    expect(onItemSelected).toHaveBeenCalledWith('qr')
  })

  it('sizes and moves the indicator to the selected item', () => {
    const renderer = render()
    const [qr, link] = items(renderer)
    layout(qr, { x: 0, width: 75 })
    layout(link, { x: 91, width: 80 })
    // Reanimated applies the shared value on the UI thread; here a re-render
    // reads it.
    act(() => {
      renderer.update(
        <TabBar
          tabBarOptions={options}
          selectedValue="link"
          onItemSelected={jest.fn()}
        />,
      )
    })

    expect(indicator(renderer).props.style).toEqual({ width: 80 })
    const moved = renderer.root.findByType(
      'Animated.View' as unknown as React.ElementType,
    )
    expect(moved.props.style).toEqual({ transform: [{ translateX: 91 }] })
  })

  it('merges the caller className into the container', () => {
    const renderer = render({ className: 'my-6' })

    expect(
      renderer.root.findAllByType('View' as never)[0].props.className,
    ).toBe('my-6')
  })
})
