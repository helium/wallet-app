import { Ticker } from '@helium/currency'
import { StackNavigationProp } from '@react-navigation/stack'

export type BuyStackParamList = {
  BuyTokenScreen: undefined
  BuyAmountScreen: {
    token: Ticker
  }
  BuyProviderScreen: undefined
}

export type BuyNavigationProp = StackNavigationProp<BuyStackParamList>
