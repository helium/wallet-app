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
  AccountsScreen: undefined
  AccountAssignScreen: undefined
  ConfirmPin: {
    action: 'payment'
  }
  PaymentScreen: undefined | PaymentRouteParam
  PaymentQrScanner: undefined
  RequestScreen: undefined
  PurchaseData: undefined
  DappLoginScreen: { uri: string; callback: string }
  WifiPurchase:
    | {
        key: string
        name: string
        params: undefined
        path: string
      }
    | undefined
  AddressBookNavigator: undefined
  NotificationsNavigator: undefined
  SettingsNavigator: undefined
  AddNewContact: undefined
  LinkWallet: WalletLink.LinkWalletRequest
  SignHotspot: WalletLink.SignHotspotRequest
  CreateAccount: undefined
  ImportAccount:
    | undefined
    | { wordCount: 12 | 24 }
    | { screen: 'AccountImportScreen'; params: { wordCount: 12 | 24 } }
  LedgerNavigator: undefined
  VoteNavigator: undefined
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
