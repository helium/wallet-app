import { LinkWalletRequest, SignHotspotRequest } from '@helium/wallet-link'
import { StackNavigationProp } from '@react-navigation/stack'
import { TokenType } from '../../generated/graphql'

export type PaymentRouteParam = {
  payer?: string
  payments?: string
  payee?: string
  amount?: string
  memo?: string
  netType?: string
  defaultTokenType?: TokenType
}
export type HomeStackParamList = {
  AccountsScreen: undefined
  AccountTokenScreen: { tokenType: TokenType }
  AccountAssignScreen: undefined
  ConfirmPin: {
    action: 'payment'
  }
  PaymentScreen: undefined | PaymentRouteParam
  PaymentQrScanner: undefined
  RequestScreen: undefined
  PurchaseData: undefined
  DappLoginScreen: { uri: string; callback: string }
  Internet:
    | {
        key?: string
        name: string
        params: undefined
        path: string
      }
    | undefined
  AddressBookNavigator: undefined
  NotificationsNavigator: undefined
  SettingsNavigator: undefined
  AddNewContact: undefined
  LinkWallet: LinkWalletRequest
  SignHotspot: SignHotspotRequest
  CreateAccount: undefined
  ImportAccount:
    | undefined
    | { wordCount: 12 | 24 }
    | {
        screen: 'AccountImportScreen'
        params: {
          wordCount: 12 | 24
          restoringAccount?: boolean
          accountAddress?: string
        }
      }
  LedgerNavigator: undefined
  VoteNavigator: undefined
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
