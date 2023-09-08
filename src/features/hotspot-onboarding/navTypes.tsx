import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export type HotspotBLEStackParamList = {
  ScanHotspots: undefined
  WifiSettings: undefined
  WifiSetup: { network: string }
  AddGatewayBle: undefined
  Diagnostics: undefined
}

export type HotspotBleNavProp =
  NativeStackNavigationProp<HotspotBLEStackParamList>
