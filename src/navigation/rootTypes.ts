import { LinkWalletRequest, SignHotspotRequest } from '@helium/wallet-link'
import { NavigatorScreenParams } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  HomeStackParamList,
  PaymentRouteParam,
} from '../features/home/homeTypes'

export type RootStackParamList = {
  OnboardingNavigator: undefined
  TabBarNavigator: NavigatorScreenParams<TabBarStackParamList> | undefined
  LinkWallet: LinkWalletRequest
  SignHotspot: SignHotspotRequest & { submit?: boolean }
  PaymentScreen: undefined | PaymentRouteParam
  RequestScreen: undefined
  DappLoginScreen: { uri: string; callback: string }
  ImportPrivateKey: { key?: string }
}

export type TabBarStackParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined
  Collectables: undefined
  Swaps: undefined
  Activity: undefined
  Governance: undefined
  NotificationsNavigator: undefined
}

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>
export type TabBarNavigationProp =
  NativeStackNavigationProp<TabBarStackParamList>
