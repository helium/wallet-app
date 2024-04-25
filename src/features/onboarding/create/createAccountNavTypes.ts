import { StackNavigationProp } from '@react-navigation/stack'

export type RouteAccount = {
  secretKey?: string
  words?: string[]
  alias?: string
  derivationPath?: string
}

export type CreateAccountStackParamList = {
  AccountCreateStartScreen: undefined
  AccountCreatePassphraseScreen: undefined
  AccountEnterPassphraseScreen: undefined | RouteAccount
  AccountAssignScreen: undefined | RouteAccount
  AccountCreatePinScreen: RouteAccount | undefined
  AccountConfirmPinScreen: RouteAccount
}

export type CreateAccountNavigationProp =
  StackNavigationProp<CreateAccountStackParamList>
