import { StackNavigationProp } from '@react-navigation/stack'

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
  CLIAccountNavigator: undefined
  VoteNavigator: undefined
}

export type AddNewAccountNavigationProp =
  StackNavigationProp<AddNewAccountParamList>
