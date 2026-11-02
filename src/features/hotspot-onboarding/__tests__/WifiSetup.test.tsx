import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import WifiSetup from '../iot-ble/WifiSetup'

jest.mock('@helium/react-native-sdk', () => ({
  useHotspotBle: () => ({ setWifi: jest.fn() }),
}))
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { network: 'home' } }),
  useNavigation: () => ({ navigate: jest.fn() }),
}))
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('../components/OnboardingScreen', () => 'OnboardingScreen')
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('WifiSetup', () => {
  it('keeps the password hidden when Show is pressed twice before a render', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<WifiSetup />)
    })
    const hidden = () =>
      renderer.root.findByType('Input' as never).props.secureTextEntry
    const toggle = () =>
      renderer.root.find(
        (n) =>
          (n.type as unknown) === 'Button' &&
          ['Show', 'Hide'].includes(n.props.children),
      ).props.onPress
    const onPress = toggle()

    act(() => {
      onPress()
      onPress()
    })
    expect(hidden()).toBe(true)

    act(() => {
      toggle()()
    })
    expect(hidden()).toBe(false)
  })
})
