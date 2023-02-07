import { StackNavigationProp } from '@react-navigation/stack'

export type RootStackParamList = {
  HomeNavigator: undefined
  OnboardingNavigator: undefined
  TabBarNavigator: undefined
}

export type TabBarStackParamList = {
  Home: undefined
  Collectables: undefined
  Swaps: undefined
  Activity: undefined
  NotificationsNavigator: undefined
}

export type RootNavigationProp = StackNavigationProp<RootStackParamList>
export type TabBarNavigationProp = StackNavigationProp<TabBarStackParamList>
