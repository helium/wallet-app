import { ReactElement } from 'react'
import AddNewAccountNavigator from '../AddNewAccountNavigator'

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'NativeStackNavigator',
    Screen: 'NativeStackScreen',
  }),
}))
jest.mock('../../../../ui/ContentColumn', () => ({
  nativeModalLayout: 'nativeModalLayout',
}))
jest.mock('../AddNewAccountScreen', () => 'AddNewAccountScreen')
jest.mock('../../../keystone/KeystoneNavigator', () => 'KeystoneNavigator')
jest.mock('../../../ledger/LedgerNavigator', () => 'LedgerNavigator')
jest.mock(
  '../../../onboarding/import/ImportAccountNavigator',
  () => 'ImportAccountNavigator',
)
jest.mock(
  '../../../onboarding/create/CreateAccountNavigator',
  () => 'CreateAccountNavigator',
)
jest.mock(
  '../../../onboarding/cli-import/CLIAccountNavigator',
  () => 'CLIAccountNavigator',
)

type NavigatorProps = {
  screenOptions?: Record<string, unknown>
  screenLayout?: unknown
}

// The navigator is a memo component with no hooks, so calling it returns the
// element tree without a renderer.
const renderNavigator = () => {
  const { type } = AddNewAccountNavigator as unknown as {
    type: () => ReactElement<NavigatorProps>
  }
  return type()
}

describe('AddNewAccountNavigator', () => {
  // iOS presents the Ledger, Keystone and import flows as full-window
  // transparent modals outside the content column, so they need their own cap
  // on iPad.
  it('caps its native modals', () => {
    const navigator = renderNavigator()

    expect(navigator.props.screenOptions?.presentation).toBe('transparentModal')
    expect(navigator.props.screenLayout).toBe('nativeModalLayout')
  })
})
