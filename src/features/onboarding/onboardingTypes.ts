import { StackNavigationProp } from '@react-navigation/stack'

export type OnboardingStackParamList = {
  Intro: undefined
  CreateImport: undefined
  CreateAccount: undefined | { screen?: string }
  ImportAccount: undefined
  LedgerNavigator: undefined
  CLIAccountNavigator: undefined
  ImportPrivateKey: { key?: string }
  OnboardingStackParamList: undefined
}

export type OnboardingNavigationProp =
  StackNavigationProp<OnboardingStackParamList>

export type OnboardingOpt = 'import' | 'create' | 'ledger'
