import { StackNavigationProp } from '@react-navigation/stack'

export type OnboardingStackParamList = {
  Intro: undefined
  CreateImport: undefined
  CreateAccount: undefined
  ImportAccount: undefined
  LedgerNavigator: undefined
}

export type OnboardingNavigationProp =
  StackNavigationProp<OnboardingStackParamList>
