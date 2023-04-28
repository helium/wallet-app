import { LinkWalletRequest, SignHotspotRequest } from '@helium/wallet-link'
import { StackNavigationProp } from '@react-navigation/stack'
import { PaymentRouteParam } from '../features/home/homeTypes'
import { HotspotWithPendingRewards } from '../types/solana'

export type RootStackParamList = {
  OnboardingNavigator: undefined
  TabBarNavigator: undefined
  LinkWallet: LinkWalletRequest
  SignHotspot: SignHotspotRequest & { submit?: boolean }
  PaymentScreen: undefined | PaymentRouteParam
  RequestScreen: undefined
  DappLoginScreen: { uri: string; callback: string }
  ImportPrivateKey: { key?: string }
  ClaimRewardsScreen: {
    hotspot: HotspotWithPendingRewards
  }
  ClaimAllRewardsScreen: undefined
  ClaimingRewardsScreen: undefined
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
