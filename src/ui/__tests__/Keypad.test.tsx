import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Keypad } from '../Keypad'

const mockTriggerImpact = jest.fn()

jest.mock(
  '@hooks/useHaptic',
  () => () => ({ triggerImpact: mockTriggerImpact }),
  { virtual: true },
)
jest.mock('@utils/i18n', () => ({ decimalSeparator: ',' }), { virtual: true })
jest.mock('@utils/layout', () => ({ getMaxFontSizeMultiplier: () => 1.5 }), {
  virtual: true,
})
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
// The node test runner cannot load react-native. Pressable renders its
// render-prop children unpressed.
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
  }
})
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ Delete: 'Delete' }))

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer.root
}

const keys = (root: TestRenderer.ReactTestInstance) =>
  root.findAllByType('Pressable' as never)

beforeEach(() => mockTriggerImpact.mockClear())

describe('Keypad', () => {
  // Maestro taps the keys by these IDs.
  it('lays out 1-9, the custom key, 0 and backspace', () => {
    const root = render(<Keypad customButtonType="cancel" />)
    expect(keys(root).map((k) => k.props.testID)).toEqual([
      'Keypad.1',
      'Keypad.2',
      'Keypad.3',
      'Keypad.4',
      'Keypad.5',
      'Keypad.6',
      'Keypad.7',
      'Keypad.8',
      'Keypad.9',
      'Keypad.cancel',
      'Keypad.0',
      'Keypad.backspace',
    ])
  })

  it('sends the key on press-in with a haptic', () => {
    const onPress = jest.fn()
    const root = render(<Keypad customButtonType="clear" onPress={onPress} />)
    const press = (id: string) =>
      act(() => {
        keys(root)
          .find((k) => k.props.testID === id)
          ?.props.onPressIn()
      })

    press('Keypad.0')
    press('Keypad.7')
    press('Keypad.backspace')
    press('Keypad.clear')

    expect(onPress.mock.calls).toEqual([[0], [7], ['backspace'], ['clear']])
    expect(mockTriggerImpact).toHaveBeenCalledTimes(4)
  })

  it('shows the locale decimal separator and disables an empty custom key', () => {
    const decimal = render(<Keypad customButtonType="decimal" />)
    expect(
      decimal.findAllByType('Text' as never).map((n) => n.props.children),
    ).toContain(',')

    const empty = render(<Keypad />)
    const custom = keys(empty)[9]
    expect(custom.props.testID).toBe('Keypad.undefined')
    expect(custom.props.disabled).toBe(true)
    expect(keys(empty)[10].props.disabled).toBe(false)
  })
})
