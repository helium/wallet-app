import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { EnrichedTransaction } from '../../types/solana'

export type ActivityStackParamList = {
  ActivityScreen: undefined
  ActivityDetailsScreen: {
    transaction: EnrichedTransaction | ConfirmedSignatureInfo
  }
}

export type ActivityNavigationProp =
  NativeStackNavigationProp<ActivityStackParamList>
