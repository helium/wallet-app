import { ReactElement } from 'react'
import SettingsNavigator from '../SettingsNavigator'

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'NativeStackNavigator',
    Screen: 'NativeStackScreen',
  }),
}))
jest.mock('uniwind', () => ({ useResolveClassNames: () => ({}) }))
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
  children: ReactElement<ScreenProps>[]
}

// The navigator is a memo component whose only hook is mocked, so calling it
// returns the element tree without a renderer.
const optionsOf = (name: string) => {
  const { type } = SettingsNavigator as unknown as {
    type: () => ReactElement<NavigatorProps>
  }
  const navigator = type()
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
})
