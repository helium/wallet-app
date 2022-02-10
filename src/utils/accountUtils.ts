import { Address, NetType } from '@helium/crypto-react-native'
import { CurrencyType } from '@helium/currency'

export type AccountNetTypeOpt = 'all' | NetType.NetType

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

export const isMainnet = (address: string) => {
  return accountNetType(address) === NetType.MAINNET
}

export const isTestnet = (address: string) => {
  return accountNetType(address) === NetType.TESTNET
}

export const ellipsizeAddress = (address: string) =>
  [address.slice(0, 8), address.slice(-8)].join('...')
