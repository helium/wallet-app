import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CSAccount } from '../../storage/cloudStorage'

export type AddressBookStackParamList = {
  AddressBook: undefined
  AddNewContact: undefined | { address: string }
  EditContact: { contact: CSAccount }
  ScanAddress: undefined
}

export type AddressBookNavigationProp =
  NativeStackNavigationProp<AddressBookStackParamList>
