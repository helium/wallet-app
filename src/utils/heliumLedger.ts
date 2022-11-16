import { PaymentV2, TokenBurnV1 } from '@helium/transactions'
import AppHelium from '@ledgerhq/hw-app-helium'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import TransportHID from '@ledgerhq/react-native-hid'
import { NetType } from '@helium/address/build/NetTypes'
import { NetTypes } from '@helium/address'

const mainNetDerivation = (account = 0) => `44'/904'/${account}'/0'/0'` // HD derivation path
const testNetDerivation = (account = 0) => `44'/905'/${account}'/0'/0'` // HD derivation path

// Replaces the account alias with the index from the ledger
export const runDerivationScheme = (account = 0, netType: NetType) => {
  if (netType === NetTypes.TESTNET) return testNetDerivation(account)
  return mainNetDerivation(account)
}

export const signLedgerPayment = async (
  transport: TransportBLE | TransportHID,
  paymentV2: PaymentV2,
  accountIndex: number,
) => {
  const helium = new AppHelium(transport)
  const { txn } = await helium.signPaymentV2(paymentV2, accountIndex)
  return txn
}

export const signLedgerBurn = async (
  transport: TransportBLE | TransportHID,
  burnV1: TokenBurnV1,
  accountIndex: number,
) => {
  const helium = new AppHelium(transport)
  return helium.signTokenBurnV1(burnV1, accountIndex)
}
