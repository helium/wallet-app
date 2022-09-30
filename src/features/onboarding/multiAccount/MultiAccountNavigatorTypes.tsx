import { StackNavigationProp } from '@react-navigation/stack'

export type MultiAccountStackParamList = {
  AccountImportStartScreen: undefined | { inline?: boolean }
  AccountCreateStart: undefined
  LedgerStart: undefined
}

export type MultiAccountNavigationProp =
  StackNavigationProp<MultiAccountStackParamList>
