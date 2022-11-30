import { StackNavigationProp } from '@react-navigation/stack'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { EnrichedTransaction } from '../../types/solana'

export type ActivityStackParamList = {
  ActivityScreen: undefined
  ActivityDetailsScreen: {
    transaction: EnrichedTransaction | ConfirmedSignatureInfo
  }
}

export type ActivityNavigationProp = StackNavigationProp<ActivityStackParamList>
