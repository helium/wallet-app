import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type SwapStackParamList = {
  SwapScreen: undefined
  SwappingScreen: { tokenA: string; tokenB: string; batchId?: string }
}

export type SwapNavigationProp = NativeStackNavigationProp<SwapStackParamList>
