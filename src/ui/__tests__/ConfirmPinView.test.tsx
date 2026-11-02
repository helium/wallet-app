import fs from 'fs'
import path from 'path'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { ConfirmPinView } from '../ConfirmPinView'

const mockTriggerImpact = jest.fn()

jest.mock(
  '@hooks/useHaptic',
  () => () => ({ triggerImpact: mockTriggerImpact }),
  { virtual: true },
)
jest.mock('@utils/i18n', () => ({ decimalSeparator: '.' }), { virtual: true })
jest.mock('@utils/layout', () => ({ getMaxFontSizeMultiplier: () => 1.5 }), {
  virtual: true,
})
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('../PressableScale', () => ({ PressableScale: 'PressableScale' }))
// Keeps the file loading if the view imports TabSafeAreaView again, so the
// source check below reports it.
jest.mock('../TabSafeAreaView', () => ({ TabSafeAreaView: 'TabSafeAreaView' }))
// The node test runner cannot load react-native. The shake runs to its end at
// once.
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  return {
    View: 'View',
    Text: 'Text',
    Pressable: ({
      children,
      ...props
    }: {
      children: (state: { pressed: boolean }) => React.ReactNode
    }) =>
      ReactActual.createElement(
        'Pressable',
        props,
        children({ pressed: false }),
      ),
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    Animated: {
      Value: class {},
      View: 'Animated.View',
      timing: () => ({}),
      sequence: () => ({ start: (done: () => void) => done() }),
    },
  }
})
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ Delete: 'Delete' }))

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = (
  props: Partial<React.ComponentProps<typeof ConfirmPinView>>,
) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <ConfirmPinView
        originalPin="123456"
        title="title"
        subtitle="subtitle"
        pinSuccess={() => {}}
        {...props}
      />,
    )
  })
  const { root } = renderer
  return {
    root,
    press: (...ids: string[]) =>
      ids.forEach((id) => {
        act(() => {
          root
            .findAllByType('Pressable' as never)
            .find((k) => k.props.testID === `Keypad.${id}`)
            ?.props.onPressIn()
        })
      }),
    filled: () =>
      root.findAll((n) => n.props.testID === 'PinDisplay.Filled').length,
  }
}

beforeEach(() => mockTriggerImpact.mockClear())

describe('ConfirmPinView', () => {
  it('fills a dot per digit and takes one back on backspace', () => {
    const view = render({})
    view.press('1', '2', '3')
    expect(view.filled()).toBe(3)
    view.press('backspace')
    expect(view.filled()).toBe(2)
  })

  it('reports the matching PIN once all six digits are in', () => {
    const pinSuccess = jest.fn()
    const view = render({ pinSuccess })
    view.press('1', '2', '3', '4', '5')
    expect(pinSuccess).not.toHaveBeenCalled()
    view.press('6')
    expect(pinSuccess.mock.calls).toEqual([['123456']])
  })

  it('ignores digits past six', () => {
    const pinSuccess = jest.fn()
    const view = render({ pinSuccess })
    view.press('1', '2', '3', '4', '5', '6', '7')
    expect(view.filled()).toBe(6)
    view.press('backspace')
    expect(view.filled()).toBe(5)
    expect(pinSuccess).toHaveBeenCalledTimes(1)
  })

  it('clears a wrong PIN with a haptic and no success', () => {
    const pinSuccess = jest.fn()
    const view = render({ pinSuccess })
    view.press('6', '5', '4', '3', '2')
    // 5 key haptics so far
    expect(mockTriggerImpact).toHaveBeenCalledTimes(5)
    view.press('1')
    expect(pinSuccess).not.toHaveBeenCalled()
    expect(view.filled()).toBe(0)
    // 6 key haptics and one failure haptic
    expect(mockTriggerImpact).toHaveBeenCalledTimes(7)
  })

  it('cancels from the cancel key', () => {
    const onCancel = jest.fn()
    const view = render({ onCancel })
    view.press('cancel')
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(view.root.findAllByType('PressableScale' as never)).toHaveLength(0)
  })

  it('swaps cancel for clear and a sign-out link when clearable', () => {
    const onCancel = jest.fn()
    const view = render({ onCancel, clearable: true })
    view.press('1', '2', 'clear')
    expect(view.filled()).toBe(0)
    expect(onCancel).not.toHaveBeenCalled()
    const signOut = view.root.findByType('PressableScale' as never)
    act(() => {
      signOut.props.onPress()
    })
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

// The lock screen renders this view outside the tab navigator, where the
// tab bar inset is wrong. Only the tab-stack screens that render it may add
// that inset.
test('does not add the tab bar inset itself', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'ConfirmPinView.tsx'),
    'utf8',
  )
  expect(source).not.toMatch(/TabSafeAreaView|BackScreen|useBottomTabBarHeight/)
})
