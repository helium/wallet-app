import React from 'react'
import { Pressable, Text as RNText } from 'react-native'
import TestRenderer, { act } from 'react-test-renderer'
import { Button } from '../Button'
import { PressableScale } from '../PressableScale'

const mockTriggerImpact = jest.fn()
let mockReducedMotion = false

jest.mock(
  '@hooks/useHaptic',
  () => () => ({ triggerImpact: mockTriggerImpact }),
  { virtual: true },
)
jest.mock(
  '@theme/motion',
  () => ({ useReducedMotion: () => mockReducedMotion }),
  { virtual: true },
)
jest.mock('@utils/layout', () => ({ getMaxFontSizeMultiplier: () => 1.5 }), {
  virtual: true,
})

// The node test runner cannot load react-native or Reanimated. The host
// components render as named elements so the test reads their props. The
// token module only needs the easing factories and the fade builders.
jest.mock('react-native', () => ({
  Pressable: 'Pressable',
  Text: 'Text',
  useWindowDimensions: () => ({ width: 390, height: 844 }),
}))
jest.mock('react-native-reanimated', () => {
  const builder = () => ({
    duration: () => ({ reduceMotion: () => ({}) }),
  })
  return {
    __esModule: true,
    default: {
      View: 'Animated.View',
      createAnimatedComponent: (component: unknown) => component,
    },
    ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
    Easing: { bezier: () => ({}) },
    cubicBezier: (x1: number, y1: number, x2: number, y2: number) => ({
      name: 'cubicBezier',
      x1,
      y1,
      x2,
      y2,
    }),
    FadeIn: builder(),
    FadeOut: builder(),
    useReducedMotion: () => false,
  }
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const EASE_OUT = { name: 'cubicBezier', x1: 0.23, y1: 1, x2: 0.32, y2: 1 }
const SCALE_AT = (scale: number) => ({
  transitionProperty: 'transform',
  transitionDuration: 120,
  transitionTimingFunction: EASE_OUT,
  transform: [{ scale }],
})
const OPACITY_AT = (opacity?: number) => ({
  transitionProperty: 'opacity',
  transitionDuration: 120,
  transitionTimingFunction: EASE_OUT,
  ...(opacity === undefined ? {} : { opacity }),
})

const render = (element: React.ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(element)
  })
  if (!renderer) throw new Error('render failed')
  const { root } = renderer
  return {
    pressable: () => root.findByType(Pressable),
    labels: () => root.findAllByType(RNText),
  }
}

const pressIn = (view: ReturnType<typeof render>) =>
  act(() => {
    view.pressable().props.onPressIn({})
  })
const pressOut = (view: ReturnType<typeof render>) =>
  act(() => {
    view.pressable().props.onPressOut({})
  })

beforeEach(() => {
  mockTriggerImpact.mockClear()
  mockReducedMotion = false
})

describe('Button', () => {
  it.each([
    ['a string', 'Send', 'Send'],
    ['a number', 5, 5],
    ['an array of text parts', ['Send ', 5, ' HNT'], ['Send ', 5, ' HNT']],
  ])('renders %s child as the variant label', (_, child, expected) => {
    const view = render(<Button onPress={jest.fn()}>{child}</Button>)

    const labels = view.labels()
    expect(labels).toHaveLength(1)
    expect(labels[0].props.children).toEqual(expected)
    expect(labels[0].props.className).toContain('text-primary-foreground')
  })

  it('renders a non-text child as given', () => {
    const view = render(
      <Button onPress={jest.fn()}>
        <RNText>custom</RNText>
      </Button>,
    )

    const labels = view.labels()
    expect(labels).toHaveLength(1)
    expect(labels[0].props.className).toBeUndefined()
  })

  it('lets the caller className win over the defaults', () => {
    const view = render(
      <Button onPress={jest.fn()} className="bg-destructive rounded-full">
        Send
      </Button>,
    )

    expect(view.pressable().props.className).toBe(
      'flex-row items-center justify-center gap-2 h-9 px-4 bg-destructive rounded-full',
    )
  })

  it('sizes the press target with the caller className', () => {
    const view = render(
      <Button onPress={jest.fn()} className="flex-1">
        Send
      </Button>,
    )

    expect(view.pressable().props.className).toContain('flex-1')
  })

  it('has the button accessibility role', () => {
    const view = render(<Button onPress={jest.fn()}>Send</Button>)

    expect(view.pressable().props.accessibilityRole).toBe('button')
  })

  it('fires one light haptic and calls onPress once per press', () => {
    const onPress = jest.fn()
    const view = render(<Button onPress={onPress}>Send</Button>)

    act(() => {
      view.pressable().props.onPress({})
    })

    expect(mockTriggerImpact).toHaveBeenCalledTimes(1)
    expect(mockTriggerImpact).toHaveBeenCalledWith('light')
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['', false],
    [' under reduced motion', true],
  ])(
    'blocks the press and keeps opacity-50 when disabled%s',
    (_, reducedMotion) => {
      mockReducedMotion = reducedMotion
      const view = render(
        <Button onPress={jest.fn()} disabled>
          Send
        </Button>,
      )

      pressIn(view)

      expect(view.pressable().props.disabled).toBe(true)
      expect(view.pressable().props.className).toContain('opacity-50')
      expect(view.pressable().props.style).not.toHaveProperty('opacity')
    },
  )

  it('gives the link variant opacity feedback, not scale', () => {
    const view = render(
      <Button variant="link" onPress={jest.fn()}>
        Learn more
      </Button>,
    )

    pressIn(view)

    expect(view.pressable().props.style).toEqual(OPACITY_AT(0.7))
  })

  it('scales the default variant while pressed', () => {
    const view = render(<Button onPress={jest.fn()}>Send</Button>)

    pressIn(view)

    expect(view.pressable().props.style).toEqual(SCALE_AT(0.97))
  })
})

describe('PressableScale', () => {
  it('sizes the press target with the className', () => {
    const view = render(
      <PressableScale onPress={jest.fn()} className="flex-1 self-stretch">
        <RNText>Card</RNText>
      </PressableScale>,
    )

    expect(view.pressable().props.className).toBe('flex-1 self-stretch')
  })

  it('has the button accessibility role', () => {
    const view = render(
      <PressableScale onPress={jest.fn()}>
        <RNText>Card</RNText>
      </PressableScale>,
    )

    expect(view.pressable().props.accessibilityRole).toBe('button')
  })

  it('scales while pressed and calls the caller press handlers', () => {
    const onPressIn = jest.fn()
    const onPressOut = jest.fn()
    const view = render(
      <PressableScale
        onPress={jest.fn()}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        className="rounded-xl"
      >
        <RNText>Card</RNText>
      </PressableScale>,
    )

    expect(view.pressable().props.className).toBe('rounded-xl')
    expect(view.pressable().props.style).toEqual(SCALE_AT(1))

    pressIn(view)
    expect(view.pressable().props.style).toEqual(SCALE_AT(0.97))
    expect(onPressIn).toHaveBeenCalledTimes(1)

    pressOut(view)
    expect(view.pressable().props.style).toEqual(SCALE_AT(1))
    expect(onPressOut).toHaveBeenCalledTimes(1)
  })

  it('fires one light haptic and calls onPress once per press', () => {
    const onPress = jest.fn()
    const view = render(
      <PressableScale onPress={onPress}>
        <RNText>Card</RNText>
      </PressableScale>,
    )

    act(() => {
      view.pressable().props.onPress({})
    })

    expect(mockTriggerImpact).toHaveBeenCalledTimes(1)
    expect(mockTriggerImpact).toHaveBeenCalledWith('light')
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('passes disabled to the Pressable', () => {
    const view = render(
      <PressableScale onPress={jest.fn()} disabled>
        <RNText>Card</RNText>
      </PressableScale>,
    )

    expect(view.pressable().props.disabled).toBe(true)
  })

  it('fades in place of scale under reduced motion', () => {
    mockReducedMotion = true
    const view = render(
      <PressableScale onPress={jest.fn()}>
        <RNText>Card</RNText>
      </PressableScale>,
    )

    pressIn(view)
    expect(view.pressable().props.style).toEqual(OPACITY_AT(0.7))

    pressOut(view)
    expect(view.pressable().props.style).toEqual(OPACITY_AT(1))
  })

  it('fades in place of scale with opacity feedback', () => {
    const view = render(
      <PressableScale onPress={jest.fn()} feedback="opacity">
        <RNText>Row</RNText>
      </PressableScale>,
    )

    pressIn(view)

    expect(view.pressable().props.style).toEqual(OPACITY_AT(0.7))
  })
})
