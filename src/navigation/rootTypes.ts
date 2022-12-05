import { StackNavigationProp } from '@react-navigation/stack'

export type RootStackParamList = {
  HomeNavigator: undefined
  OnboardingNavigator: undefined
  TabBarNavigator: undefined
}

export type RootNavigationProp = StackNavigationProp<RootStackParamList>
