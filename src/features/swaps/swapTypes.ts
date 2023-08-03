import { StackNavigationProp } from '@react-navigation/stack'

export type SwapStackParamList = {
  SwapScreen: undefined
  SwappingScreen: { tokenA: string; tokenB: string }
}

export type SwapNavigationProp = StackNavigationProp<SwapStackParamList>
