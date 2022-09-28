import { StackNavigationProp } from '@react-navigation/stack'

export type AddNewAccountParamList = {
  AddNewAccount: undefined
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
  CLIAccountNavigator: undefined
  VoteNavigator: undefined
}

export type AddNewAccountNavigationProp =
  StackNavigationProp<AddNewAccountParamList>
