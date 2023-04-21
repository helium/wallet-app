import { JsonMetadata } from '@metaplex-foundation/js'
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
  CollectionScreen: {
    collection: Collectable[]
  }
  NftDetailsScreen: {
    collectable: Collectable
  }
  HotspotDetailsScreen: {
    collectable: HotspotWithPendingRewards
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
}

export type CollectableNavigationProp =
  StackNavigationProp<CollectableStackParamList>
