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
  OnboardingParent: undefined
}

export type RootNavigationProp = StackNavigationProp<RootStackParamList>
