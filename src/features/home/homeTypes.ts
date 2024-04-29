import { StackNavigationProp } from '@react-navigation/stack'
import { RouteAccount } from '../onboarding/create/createAccountNavTypes'

export type PaymentRouteParam = {
  payer?: string
  payments?: string
  payee?: string
  amount?: string
  memo?: string
  netType?: string
  defaultTokenType?: string
  mint?: string
}

export type BurnRouteParam = {
  address: string
  amount?: string
  memo?: string
  isDelegate?: boolean
  mint?: string
}

export type HomeStackParamList = {
  AccountsScreen: undefined
  AccountManageTokenListScreen: undefined
  AccountTokenScreen: { mint: string }
  AccountAssignScreen: undefined | RouteAccount
  ConfirmPin: {
    action: 'payment'
  }
  PaymentScreen: undefined | PaymentRouteParam
  AirdropScreen: { mint: string }
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
