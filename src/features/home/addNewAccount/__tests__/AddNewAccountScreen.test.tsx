import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AddNewAccountScreen from '../AddNewAccountScreen'

const mockGoBack = jest.fn()

// @react-navigation ships ESM only, which this jest config does not
// transform.
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: () => {}, goBack: mockGoBack }),
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View', ScrollView: 'ScrollView' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))
jest.mock('@theme/motion', () => ({ FADE_IN: {}, FADE_OUT: {} }), {
  virtual: true,
})
jest.mock('@ui/TabBar', () => ({ TabBar: 'TabBar' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/CloseButton', () => ({ CloseButton: 'CloseButton' }), {
  virtual: true,
})
jest.mock(
  '../../../keystone/ConnectKeystoneStartScreen',
  () => 'ConnectKeystoneStart',
)
jest.mock('../../../ledger/PairStart', () => 'PairStart')
jest.mock(
  '../../../onboarding/create/AccountCreateStart',
  () => 'AccountCreateStart',
)
jest.mock(
  '../../../onboarding/import/AccountImportStartScreen',
  () => 'AccountImportStartScreen',
)

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('AddNewAccountScreen', () => {
  it('shows a labelled close control that goes back', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<AddNewAccountScreen />)
    })

    const close = renderer.root.findByType('CloseButton' as never)
    expect(close.props.accessibilityLabel).toBe('generic.close')
    act(() => {
      close.props.onPress()
    })
    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })
})
