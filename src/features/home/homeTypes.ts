import { LinkWalletRequest, SignHotspotRequest } from '@helium/wallet-link'
import { StackNavigationProp } from '@react-navigation/stack'
import { TokenType } from '../../types/activity'

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
  OnboardData: undefined
  DappLoginScreen: { uri: string; callback: string }
  AddressBookNavigator: undefined
  NotificationsNavigator: undefined
  SettingsNavigator: undefined
  AddNewContact: undefined
  LinkWallet: LinkWalletRequest
  SignHotspot: SignHotspotRequest
  AddNewAccountNavigator: undefined
  ReImportAccountNavigator:
    | undefined
    | {
        screen: 'AccountImportScreen'
        params: {
          restoringAccount?: boolean
          accountAddress?: string
        }
      }
  VoteNavigator: undefined
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
