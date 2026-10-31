import { ReactElement } from 'react'
import AddressBookNavigator from '../AddressBookNavigator'

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
jest.mock('../AddressBook', () => 'AddressBook')
jest.mock('../AddNewContact', () => 'AddNewContact')
jest.mock('../EditContact', () => 'EditContact')
jest.mock('../AddressQrScanner', () => 'AddressQrScanner')

type NavigatorProps = {
  screenOptions?: Record<string, unknown>
  screenLayout?: unknown
}

// The navigator's only hook is mocked, so calling it returns the element tree
// without a renderer.
const renderNavigator = () =>
  (AddressBookNavigator as unknown as () => ReactElement<NavigatorProps>)()

describe('AddressBookNavigator', () => {
  // iOS presents the contact and scanner screens as page sheets outside the
  // content column, so they need their own cap on iPad.
  it('caps its native modals', () => {
    const navigator = renderNavigator()

    expect(navigator.props.screenOptions?.presentation).toBe('modal')
    expect(navigator.props.screenLayout).toBe('nativeModalLayout')
  })
})
