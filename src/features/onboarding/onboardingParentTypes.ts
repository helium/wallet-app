import { StackNavigationProp } from '@react-navigation/stack'

export type OnboardingParentStackParamList = {
  Intro: undefined
  CreateImport: undefined
  OnboardingNavigator: undefined
}

export type OnboardingParentNavigationProp =
  StackNavigationProp<OnboardingParentStackParamList>
