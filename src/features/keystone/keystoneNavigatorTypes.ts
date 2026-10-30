import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { KeystoneAccountType } from './SelectKeystoneAccountsScreen'

export type KeystoneStackParamList = {
  ScanQrCode: undefined
  SelectKeystoneAccounts: { derivationAccounts: KeystoneAccountType[] }
  KeystoneAccountAssignScreen: undefined
}

export type KeystoneNavigationProp =
  NativeStackNavigationProp<KeystoneStackParamList>
