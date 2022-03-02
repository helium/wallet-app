import { WalletLink } from '@helium/react-native-sdk'
import { StackNavigationProp } from '@react-navigation/stack'

export type HomeStackParamList = {
  AddAccount: {
    screen: 'CreateImport'
  }
  AccountsScreen: undefined
  AccountAssignScreen: undefined
  PaymentScreen:
    | undefined
    | {
        payer?: string
        payments?: string
        payee?: string
        amount?: string
        memo?: string
        netType?: string
      }
  RequestScreen: undefined
  AddressBookNavigator: undefined
  WifiPurchase:
    | {
        key: string
        name: string
        params: undefined
        path: string
      }
    | undefined
  SettingsNavigator: undefined
  AddNewContact: undefined
  LinkWallet: WalletLink.LinkWalletRequest
  SignHotspot: WalletLink.SignHotspotRequest
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
