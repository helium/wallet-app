import { StackNavigationProp } from '@react-navigation/stack'
import { CSAccount } from '../../storage/cloudStorage'

export type AddressBookStackParamList = {
  AddressBook: undefined
  AddNewContact: undefined | { address: string }
  EditContact: { contact: CSAccount }
}

export type AddressBookNavigationProp =
  StackNavigationProp<AddressBookStackParamList>
