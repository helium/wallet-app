import { StackNavigationProp } from '@react-navigation/stack'
import { RouteAccount } from '../create/createAccountNavTypes'

export type ImportAccountStackParamList = {
  AccountImportStartScreen: undefined
  AccountImportScreen: {
    restoringAccount?: boolean
    accountAddress?: string
  }
  AccountAssignScreen: undefined
  AccountCreatePinScreen:
    | ({
        pinReset?: boolean
      } & RouteAccount)
    | undefined
  AccountConfirmPinScreen: {
    pin: string
  } & RouteAccount
  ImportSubAccounts: undefined
  CLIAccountNavigator: undefined
}

export type ImportAccountNavigationProp =
  StackNavigationProp<ImportAccountStackParamList>
