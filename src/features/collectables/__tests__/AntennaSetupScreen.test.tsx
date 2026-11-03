import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AntennaSetupScreen from '../AntennaSetupScreen'

// Resolved by each test, so a submit stays in flight until the test ends it.
let mockFinishSubmit: ((error?: Error) => void) | undefined
const mockSubmitUpdateEntityInfo = jest.fn(
  () =>
    new Promise<string>((resolve, reject) => {
      mockFinishSubmit = (error) => (error ? reject(error) : resolve('batch'))
    }),
)

jest.mock('@ui/TabSafeAreaView', () => ({ TabSafeAreaView: 'SafeAreaView' }), {
  virtual: true,
})
jest.mock(
  '@hooks/useSubmitTxn',
  () => () => ({ submitUpdateEntityInfo: mockSubmitUpdateEntityInfo }),
  { virtual: true },
)
jest.mock('@hooks/useEntityKey', () => ({ useEntityKey: () => 'entity' }), {
  virtual: true,
})
jest.mock(
  '@hooks/useIotInfo',
  () => {
    const iotInfo = { info: { location: 'hex', gain: 12, elevation: 5 } }
    return { useIotInfo: () => iotInfo }
  },
  { virtual: true },
)
jest.mock('@react-navigation/native', () => {
  const navigation = { push: jest.fn(), goBack: jest.fn() }
  const route = { params: { collectable: {} } }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Card', () => ({ Card: 'Card' }), { virtual: true })
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  Keyboard: { dismiss: () => {} },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  View: 'View',
}))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../components/BackHeader', () => 'BackHeader')
jest.mock('../../../utils/h3', () => ({
  parseH3BNLocation: () => [40, -105],
}))
jest.mock('../../../utils/logger', () => ({ error: () => {} }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const submitButton = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findByType('Button' as never)

beforeEach(() => {
  mockSubmitUpdateEntityInfo.mockClear()
  mockFinishSubmit = undefined
})

describe('AntennaSetupScreen', () => {
  // A second press while the update is in flight would send a second
  // transaction.
  it('disables submit while an update is in flight', async () => {
    let created: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      created = TestRenderer.create(<AntennaSetupScreen />)
    })
    if (!created) throw new Error('render failed')
    const renderer = created

    expect(submitButton(renderer).props.disabled).toBe(false)
    act(() => {
      submitButton(renderer).props.onPress()
    })
    expect(mockSubmitUpdateEntityInfo).toHaveBeenCalledTimes(1)
    expect(submitButton(renderer).props.disabled).toBe(true)

    await act(async () => {
      mockFinishSubmit?.(new Error('rejected'))
    })
    expect(submitButton(renderer).props.disabled).toBe(false)
  })
})
