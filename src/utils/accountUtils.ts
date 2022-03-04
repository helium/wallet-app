import { Address, NetType } from '@helium/crypto-react-native'
import { CurrencyType } from '@helium/currency'
import Bcrypt from 'bcrypt-react-native'

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

export const isValidAccountHash = async (address: string, hash: string) => {
  return Bcrypt.compareSync(address, hash)
}

export const ellipsizeAddress = (address: string) =>
  [address.slice(0, 8), address.slice(-8)].join('...')

export const formatAccountAlias = (
  opts?: {
    alias: string
    netType?: NetType.NetType
  } | null,
) => {
  if (!opts) return ''
  const { alias, netType } = opts
  return `${alias}${netType === NetType.TESTNET ? ' (Testnet)' : ''}`
}
