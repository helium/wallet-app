import { StackNavigationProp } from '@react-navigation/stack'
import { SubmitIntentResponse } from '@dflow-protocol/swap-api-utils'
import { Transaction } from '@solana/web3.js'
import { Intent } from '@config/storage/DFlowProvider'

export type SwapStackParamList = {
  SwapScreen: undefined
  SwappingScreen: {
    tokenA: string
    tokenB: string
    intent: Intent
    signedOpenTransaction: Transaction
    submitIntentResponse: SubmitIntentResponse
  }
}

export type SwapNavigationProp = StackNavigationProp<SwapStackParamList>
