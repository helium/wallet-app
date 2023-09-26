import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { IotBleOptions } from '../navTypes'

export type HotspotBLEStackParamList = {
  ScanHotspots: IotBleOptions
  WifiSettings: undefined
  WifiSetup: { network: string }
  AddGatewayBle: undefined
  Diagnostics: undefined
}

export type HotspotBleNavProp =
  NativeStackNavigationProp<HotspotBLEStackParamList>
