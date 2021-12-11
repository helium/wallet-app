import { StackNavigationProp } from '@react-navigation/stack'

export type HomeStackParamList = {
  AddAccount: {
    screen: 'CreateImport'
  }
  AccountsScreen: undefined
  AccountAssignScreen: undefined
  PaymentScreen: undefined
  AddressBookNavigator: undefined
  WifiOnboard:
    | {
        key: string
        name: string
        params: undefined
        path: string
      }
    | undefined
}

export type HomeNavigationProp = StackNavigationProp<HomeStackParamList>
