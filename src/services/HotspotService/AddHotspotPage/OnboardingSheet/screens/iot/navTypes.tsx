import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { IotBleOptions } from '../../../../../../features/hotspot-onboarding/navTypes'

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
