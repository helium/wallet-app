import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type EncyptedAccountRouteParam = {
  address: string
  seed: {
    ciphertext: string
    nonce: string
    salt: string
    version: number
  }
}

export type CLIAccountStackParamList = {
  CLIAccountImportStartScreen: undefined
  CLIQrScanner: undefined
  CLIPasswordScreen: EncyptedAccountRouteParam
  AccountAssignScreen: undefined
}

export type CLIAccountNavigationProp =
  NativeStackNavigationProp<CLIAccountStackParamList>
