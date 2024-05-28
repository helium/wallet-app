import { StackNavigationProp } from '@react-navigation/stack'
import {
  Collectable,
  CompressedNFT,
  HotspotWithPendingRewards,
} from '../../types/solana'

export type PaymentRouteParam = {
  collectable?: CompressedNFT
}

export type CollectableStackParamList = {
  CollectablesTopTab: undefined
  HotspotMapScreen:
    | undefined
    | {
        hotspot?: HotspotWithPendingRewards
        network?: 'IOT' | 'MOBILE'
      }
  AssertLocationScreen: {
    collectable: HotspotWithPendingRewards
  }
  AntennaSetupScreen: {
    collectable: HotspotWithPendingRewards
  }
  SettingUpAntennaScreen: undefined
  PaymentScreen: undefined | PaymentRouteParam
  ClaimRewardsScreen: {
    hotspot: HotspotWithPendingRewards
  }
  ClaimAllRewardsScreen: undefined
  ClaimingRewardsScreen: undefined
  ChangeRewardsRecipientScreen: {
    hotspot: HotspotWithPendingRewards
  }
  CollectionScreen: {
    collection: Collectable[]
  }
  NftDetailsScreen: {
    collectable: Collectable
  }
  NftMetadataScreen: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata: any
  }
  TransferCollectableScreen: {
    collectable: CompressedNFT | Collectable
  }
  TransferCompleteScreen: {
    collectable: CompressedNFT | Collectable
  }
  AddNewContact: undefined
  PaymentQrScanner: undefined
  AddressBookNavigator: undefined
  ScanAddress: undefined
  OnboardingNavigator: undefined
}

export type CollectableNavigationProp =
  StackNavigationProp<CollectableStackParamList>
