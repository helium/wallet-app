import { WalletLink } from '@helium/react-native-sdk'
import { StackNavigationProp } from '@react-navigation/stack'

export type PaymentRouteParam = {
  payer?: string
  payments?: string
  payee?: string
  amount?: string
  memo?: string
  netType?: string
}
export type HomeStackParamList = {
  AddAccount: {
    screen: 'CreateImport'
  }
  AccountsScreen: undefined
  AccountAssignScreen: undefined
  PaymentScreen: undefined | PaymentRouteParam
  PaymentQrScanner: undefined
  RequestScreen: undefined
  AddressBookNavigator: undefined
  NotificationsNavigator: undefined
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
  ConfirmPin: {
    action: 'payment'
  }
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
