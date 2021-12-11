import { StackNavigationProp } from '@react-navigation/stack'

export type AddressBookStackParamList = {
  AddressBook: undefined
  AddNewContact: undefined
}

export type AddressBookNavigationProp =
  StackNavigationProp<AddressBookStackParamList>
