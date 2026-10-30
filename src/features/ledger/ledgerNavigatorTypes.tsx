import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LedgerDevice } from '../../storage/cloudStorage'

export type LedgerNavigatorStackParamList = {
  DeviceChooseType: undefined
  DeviceScanUsb: { error: Error } | undefined
  DeviceScan: { error: Error } | undefined
  DeviceShow: { ledgerDevice: LedgerDevice }
  PairSuccess: undefined
}

export type LedgerNavigatorNavigationProp =
  NativeStackNavigationProp<LedgerNavigatorStackParamList>
