import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type MultiAccountStackParamList = {
  AccountImportStartScreen: undefined | { inline?: boolean }
  AccountCreateStart: undefined
  LedgerStart: undefined
}

export type MultiAccountNavigationProp =
  NativeStackNavigationProp<MultiAccountStackParamList>
