import { StackNavigationProp } from '@react-navigation/stack'

export type RootStackParamList = {
  HomeNavigator: {
    initialRouteName: string
    screens: {
      PaymentScreen: string
      WifiOnboard: string
      LinkWallet: string
    }
  }
  OnboardingNavigator: undefined
}

export type RootNavigationProp = StackNavigationProp<RootStackParamList>
