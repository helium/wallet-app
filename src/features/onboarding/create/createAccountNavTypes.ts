import { NativeStackNavigationProp } from '@react-navigation/native-stack'

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
  KeystoneAccountAssignScreen: undefined
}

export type CreateAccountNavigationProp =
  NativeStackNavigationProp<CreateAccountStackParamList>
