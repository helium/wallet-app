import { StackNavigationProp } from '@react-navigation/stack'
import { KeystoneAccountType } from './SelectKeystoneAccountsScreen'

export type KeystoneStackParamList = {
  ScanQrCode: undefined
  SelectKeystoneAccounts: { derivationAccounts: KeystoneAccountType[] }
  KeystoneAccountAssignScreen: undefined
}

export type KeystoneNavigationProp = StackNavigationProp<KeystoneStackParamList>
