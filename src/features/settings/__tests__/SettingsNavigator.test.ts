import { ReactElement } from 'react'
import SettingsNavigator from '../SettingsNavigator'

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'NativeStackNavigator',
    Screen: 'NativeStackScreen',
  }),
}))
jest.mock('uniwind', () => ({ useResolveClassNames: () => ({}) }))
jest.mock('../../../ui/ContentColumn', () => ({
  nativeModalLayout: 'nativeModalLayout',
}))
jest.mock('../SecretKeyWarningScreen', () => 'SecretKeyWarningScreen')
jest.mock('../../migration/SolanaMigration', () => 'SolanaMigration')
jest.mock('../../migration/MigrateToWorld', () => 'MigrateToWorld')
jest.mock('../AutoGasManager', () => 'AutoGasManager')
jest.mock('../ConfirmSignoutScreen', () => 'ConfirmSignoutScreen')
jest.mock('../RevealPrivateKeyScreen', () => 'RevealPrivateKeyScreen')
jest.mock('../RevealWordsScreen', () => 'RevealWordsScreen')
jest.mock('../Settings', () => 'Settings')
jest.mock('../SettingsConfirmPinScreen', () => 'SettingsConfirmPinScreen')
jest.mock('../SettingsCreatePinScreen', () => 'SettingsCreatePinScreen')
jest.mock('../ShareAddressScreen', () => 'ShareAddressScreen')
jest.mock('../UpdateAliasScreen', () => 'UpdateAliasScreen')

type ScreenProps = { name: string; options?: Record<string, unknown> }
type NavigatorProps = {
  screenOptions?: Record<string, unknown>
  screenLayout?: unknown
  children: ReactElement<ScreenProps>[]
}

// The navigator is a memo component whose only hook is mocked, so calling it
// returns the element tree without a renderer.
const renderNavigator = () => {
  const { type } = SettingsNavigator as unknown as {
    type: () => ReactElement<NavigatorProps>
  }
  return type()
}
const optionsOf = (name: string) => {
  const navigator = renderNavigator()
  const screen = navigator.props.children.find((s) => s.props.name === name)
  return { ...navigator.props.screenOptions, ...screen?.props.options }
}

describe('SettingsNavigator', () => {
  // MigrateToWorld signs with the source wallet, which opens the root Ledger
  // or Keystone overlay; a native iOS modal would cover it.
  it('presents MigrateToWorld as a card sliding from the bottom', () => {
    const options = optionsOf('MigrateToWorld')

    expect(options.presentation).toBe('card')
    expect(options.animation).toBe('slide_from_bottom')
  })

  // iOS presents the PIN, secret key and auto-gas modals outside the content
  // column, so they need their own cap on iPad.
  it('caps its native modals', () => {
    expect(renderNavigator().props.screenLayout).toBe('nativeModalLayout')
  })
})
