import { JsonMetadata } from '@metaplex-foundation/js'
import { StackNavigationProp } from '@react-navigation/stack'
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
    collectable: CompressedNFT
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
  AddNewContact: undefined
  PaymentQrScanner: undefined
  AddressBookNavigator: undefined
}

export type CollectableNavigationProp =
  StackNavigationProp<CollectableStackParamList>
