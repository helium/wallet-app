import { JsonMetadata } from '@metaplex-foundation/js'
import { StackNavigationProp } from '@react-navigation/stack'
import { Collectable } from '../../types/solana'

export type PaymentRouteParam = {
  collectable?: Collectable
}

export type CollectableStackParamList = {
  CollectionScreen: {
    collection: Collectable[]
  }
  NftDetailsScreen: {
    collectable: Collectable
  }
  HotspotDetailsScreen: {
    collectable: Collectable
  }
  NftMetadataScreen: {
    metadata: JsonMetadata<string>
  }
  TransferCollectableScreen: {
    collectable: Collectable
  }
  TransferCompleteScreen: {
    collectable: Collectable
  }
  AddNewContact: undefined
  PaymentQrScanner: undefined
  AddressBookNavigator: undefined
}

export type CollectableNavigationProp =
  StackNavigationProp<CollectableStackParamList>
