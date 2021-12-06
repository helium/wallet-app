import { StackNavigationProp } from '@react-navigation/stack'

export type RootStackParamList = {
  HomeNavigator: {
    initialRouteName: string
    screens: { PaymentScreen: string; WifiOnboard: string }
  }
  OnboardingParent: undefined
}

export type RootNavigationProp = StackNavigationProp<RootStackParamList>
