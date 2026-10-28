import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type AddNewAccountParamList = {
  AddNewAccount: undefined
  CreateAccount: undefined
  ImportAccount:
    | undefined
    | {
        screen: 'AccountImportScreen'
        params: {
          restoringAccount?: boolean
          accountAddress?: string
        }
      }
  LedgerNavigator: undefined
  KeystoneNavigator: undefined
  CLIAccountNavigator: undefined
  VoteNavigator: undefined
}

export type AddNewAccountNavigationProp =
  NativeStackNavigationProp<AddNewAccountParamList>
