import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { IotBleOptions } from '../navTypes'

export type HotspotBLEStackParamList = {
  ScanHotspots: IotBleOptions
  WifiSettings: { network?: string }
  WifiSetup: { network: string }
  AddGatewayBle: undefined
  Diagnostics: undefined
}

export type HotspotBleNavProp =
  NativeStackNavigationProp<HotspotBLEStackParamList>
