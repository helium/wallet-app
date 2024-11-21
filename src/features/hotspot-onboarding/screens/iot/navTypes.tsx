import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type IotBleOptions = {
  bleInstructions?: string
}

export type HotspotBLEStackParamList = {
  ScanHotspots: IotBleOptions
  Settings: undefined
  WifiSettings: { network?: string }
  WifiSetup: { network: string }
  AddGatewayBle: {
    createGatewayTx?: string
    onboardingAddress: string
    network: 'IOT' | 'MOBILE'
  }
  Diagnostics: undefined
}

export type HotspotBleNavProp =
  NativeStackNavigationProp<HotspotBLEStackParamList>
