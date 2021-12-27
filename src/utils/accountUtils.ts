import { Address, NetType } from '@helium/crypto-react-native'
import { CurrencyType } from '@helium/currency'

export const accountCurrencyType = (address?: string) => {
  if (!address) return CurrencyType.default
  return accountNetType(address) === NetType.TESTNET
    ? CurrencyType.testNetworkToken
    : CurrencyType.default
}

export const accountNetType = (address?: string) => {
  if (!address) return NetType.MAINNET
  return Address.fromB58(address)?.netType
}
