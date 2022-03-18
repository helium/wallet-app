import { StackNavigationProp } from '@react-navigation/stack'
import { LedgerDevice } from '../../storage/cloudStorage'

export type LedgerNavigatorStackParamList = {
  DeviceScan: { error: Error } | undefined
  DeviceShow: { ledgerDevice: LedgerDevice }
  PairSuccess: undefined
}

export type LedgerNavigatorNavigationProp =
  StackNavigationProp<LedgerNavigatorStackParamList>
