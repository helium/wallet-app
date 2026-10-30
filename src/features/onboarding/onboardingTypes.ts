import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type OnboardingStackParamList = {
  Intro: undefined
  CreateImport: undefined
  CreateAccount: undefined | { screen?: string }
  ImportAccount: undefined
  LedgerNavigator: undefined
  CLIAccountNavigator: undefined
  ImportPrivateKey: { key?: string }
  OnboardingStackParamList: undefined
  KeystoneNavigator: undefined
}

export type OnboardingNavigationProp =
  NativeStackNavigationProp<OnboardingStackParamList>

export type OnboardingOpt = 'import' | 'create' | 'ledger' | 'keystone'
