import { ReactElement } from 'react'
import HomeNavigator from '../HomeNavigator'

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'NativeStackNavigator',
    Screen: 'NativeStackScreen',
  }),
}))
jest.mock('@components/ConfirmPinScreen', () => 'ConfirmPinScreen', {
  virtual: true,
})
jest.mock('../../account/AccountsScreen', () => 'AccountsScreen')
jest.mock('../../account/AccountTokenScreen', () => 'AccountTokenScreen')
jest.mock('../../account/AirdropScreen', () => 'AirdropScreen')
jest.mock(
  '../../account/AccountManageTokenListScreen',
  () => 'AccountManageTokenListScreen',
)
jest.mock('../../addressBook/AddNewContact', () => 'AddNewContact')
jest.mock(
  '../../addressBook/AddressBookNavigator',
  () => 'AddressBookNavigator',
)
jest.mock('../../addressBook/AddressQrScanner', () => 'AddressQrScanner')
jest.mock('../../burn/BurnScreen', () => 'BurnScreen')
jest.mock(
  '../../notifications/NotificationsNavigator',
  () => 'NotificationsNavigator',
)
jest.mock('../../onboarding/AccountAssignScreen', () => 'AccountAssignScreen')
jest.mock(
  '../../onboarding/import/ImportAccountNavigator',
  () => 'ImportAccountNavigator',
)
jest.mock('../../payment/PaymentQrScanner', () => 'PaymentQrScanner')
jest.mock('../../payment/PaymentScreen', () => 'PaymentScreen')
jest.mock('../../request/RequestScreen', () => 'RequestScreen')
jest.mock('../../settings/SettingsNavigator', () => 'SettingsNavigator')
jest.mock('../../swaps/SwapNavigator', () => 'SwapNavigator')
jest.mock(
  '../addNewAccount/AddNewAccountNavigator',
  () => 'AddNewAccountNavigator',
)
jest.mock(
  '../../onboarding/import/ImportSubAccountsScreen',
  () => 'ImportSubAccountsScreen',
)
jest.mock(
  '../../keystone/KeystoneAccountAssignScreen',
  () => 'KeystoneAccountAssignScreen',
)

type ScreenProps = { name: string; options?: Record<string, unknown> }
type NavigatorProps = {
  screenOptions?: Record<string, unknown>
  children: ReactElement<ScreenProps>[]
}

// The navigator is a memo component with no hooks, so calling it returns the
// element tree without a renderer.
const renderNavigator = () => {
  const { type } = HomeNavigator as unknown as {
    type: () => ReactElement<NavigatorProps>
  }
  const navigator = type()
  const optionsOf = (name: string) => {
    const screen = navigator.props.children.find((s) => s.props.name === name)
    return {
      ...navigator.props.screenOptions,
      ...screen?.props.options,
    }
  }
  return { navigator, optionsOf }
}

describe('HomeNavigator', () => {
  // Root overlays (wallet sign sheet, Ledger, Keystone, keyboard portal) draw
  // in the root view, so a native iOS modal would cover them.
  it.each([
    'PaymentScreen',
    'PaymentQrScanner',
    'RequestScreen',
    'AddressBookNavigator',
    'NotificationsNavigator',
    'SettingsNavigator',
    'SwapNavigator',
    'AddNewAccountNavigator',
  ])('presents %s as a card sliding from the bottom', (name) => {
    const options = renderNavigator().optionsOf(name)

    expect(options.presentation).toBe('card')
    expect(options.animation).toBe('slide_from_bottom')
  })

  it('presents no route as a native modal', () => {
    const { navigator, optionsOf } = renderNavigator()

    navigator.props.children.forEach(({ props: { name } }) => {
      expect([undefined, 'card']).toContain(optionsOf(name).presentation)
    })
  })
})
