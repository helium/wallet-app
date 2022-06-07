import { StackNavigationProp } from '@react-navigation/stack'

export type RootStackParamList = {
  HomeNavigator: {
    initialRouteName: string
    screens: {
      PaymentScreen: string
      InternetPurchase: string
      LinkWallet: string
      DappLogin: string
    }
  }
  OnboardingNavigator: undefined
}

export type RootNavigationProp = StackNavigationProp<RootStackParamList>
