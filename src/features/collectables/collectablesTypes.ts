import { JsonMetadata } from '@metaplex-foundation/js'
import { StackNavigationProp } from '@react-navigation/stack'
import { Collectable, CompressedNFT, HotspotWithMeta } from '../../types/solana'

export type PaymentRouteParam = {
  collectable?: CompressedNFT
}

export type CollectableStackParamList = {
  CollectablesTopTab: undefined
  HotspotDetailsScreen: {
    collectable: HotspotWithMeta
  }
  HotspotAssertLocationScreen: {
    collectable: HotspotWithMeta
  }
  PaymentScreen: undefined | PaymentRouteParam

  ClaimRewardsScreen: {
    hotspot: HotspotWithMeta
  }
  ClaimAllRewardsScreen: undefined
  ClaimingRewardsScreen: undefined

  CollectionScreen: {
    collection: Collectable[]
  }
  NftDetailsScreen: {
    collectable: Collectable
  }
  NftMetadataScreen: {
    metadata: JsonMetadata<string>
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
}

export type CollectableNavigationProp =
  StackNavigationProp<CollectableStackParamList>
