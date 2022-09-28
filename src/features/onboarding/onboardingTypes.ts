import { StackNavigationProp } from '@react-navigation/stack'

export type OnboardingStackParamList = {
  Intro: undefined
  CreateImport: undefined
  CreateAccount: undefined
  ImportAccount: undefined
  LedgerNavigator: undefined
  CLIAccountNavigator: undefined
}

export type OnboardingNavigationProp =
  StackNavigationProp<OnboardingStackParamList>

export type OnboardingOpt = 'import' | 'create' | 'ledger'
