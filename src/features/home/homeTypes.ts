import { Ticker } from '@helium/currency'
import { StackNavigationProp } from '@react-navigation/stack'

export type PaymentRouteParam = {
  payer?: string
  payments?: string
  payee?: string
  amount?: string
  memo?: string
  netType?: string
  defaultTokenType?: Ticker
}

export type BurnRouteParam = {
  address: string
  amount: string
  memo?: string
  isDelegate?: boolean
}

export type HomeStackParamList = {
  AccountsScreen: undefined
  AccountTokenScreen: { tokenType: Ticker }
  AccountAssignScreen:
    | undefined
    | {
        secureAccount?: {
          mnemonic: string[]
          keypair: { pk: string; sk: string }
          address: string
        }
      }
  ConfirmPin: {
    action: 'payment'
  }
  PaymentScreen: undefined | PaymentRouteParam
  AirdropScreen: { ticker: Ticker }
  BurnScreen: BurnRouteParam
  PaymentQrScanner: undefined
  RequestScreen: undefined
  OnboardData: undefined
  AddressBookNavigator: undefined
  NotificationsNavigator: undefined
  SettingsNavigator: undefined
  AddNewContact: undefined
  AddNewAccountNavigator: undefined
  SwapNavigator: undefined
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
