import { NetType } from '@helium/crypto-react-native'
import { PaymentV1 } from '@helium/transactions'
import AppHelium from '@ledgerhq/hw-app-helium'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'

const mainNetPath = "44'/904'/0'/0/0" // HD derivation path
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const testNetPath = "44'/905'/0'/0/0" // HD derivation path
// TODO: Support testnet ^

const getPath = (netType: NetType.NetType) => {
  if (netType === NetType.TESTNET) {
    return testNetPath
  }
  return mainNetPath
}

export const getLedgerAddress = async (
  transport: TransportBLE,
  netType: NetType.NetType = NetType.MAINNET,
) => {
  const helium = new AppHelium(transport)
  const path = getPath(netType)
  const { address } = await helium.getAddress(path, true, 0)
  return address
}

export const signLedgerPayment = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transport: TransportBLE,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  paymentV1: PaymentV1,
) => {
  // TODO: Bring this back when payment support is merged into ledger sdk
  // const helium = new AppHelium(transport)
  // const { txn } = await helium.signPaymentV1(paymentV1, 0)
  // return txn
}
