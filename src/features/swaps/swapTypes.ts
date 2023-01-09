import { Ticker } from '@helium/currency'
import { StackNavigationProp } from '@react-navigation/stack'

export type SwapStackParamList = {
  SwapScreen: undefined
  SwappingScreen: { tokenA: Ticker; tokenB: Ticker }
}

export type SwapNavigationProp = StackNavigationProp<SwapStackParamList>
