import { JsonMetadata } from '@metaplex-foundation/js'
import { StackNavigationProp } from '@react-navigation/stack'
import { HotspotWithPendingRewards } from '../../utils/solanaUtils'
import { CompressedNFT } from '../../types/solana'

export type PaymentRouteParam = {
  collectable?: CompressedNFT
}

export type CollectableStackParamList = {
  CollectionScreen: {
    collection: CompressedNFT[]
  }
  NftDetailsScreen: {
    collectable: CompressedNFT
  }
  HotspotDetailsScreen: {
    collectable: HotspotWithPendingRewards
  }
  NftMetadataScreen: {
    metadata: JsonMetadata<string>
  }
  TransferCollectableScreen: {
    collectable: CompressedNFT
  }
  TransferCompleteScreen: {
    collectable: CompressedNFT
  }
  ClaimRewardsScreen: {
    hotspot: HotspotWithPendingRewards
  }
  ClaimAllRewardsScreen: undefined
  ClaimingRewardsScreen: undefined
  AddNewContact: undefined
  PaymentQrScanner: undefined
  AddressBookNavigator: undefined
}

export type CollectableNavigationProp =
  StackNavigationProp<CollectableStackParamList>
