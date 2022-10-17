import Address, { NetTypes as NetType, utils } from '@helium/address'
import { CurrencyType } from '@helium/currency'
import Bcrypt from 'bcrypt-react-native'
import { TokenType } from '../generated/graphql'

export type L1Network = 'helium' | 'solana_dev'

export type AccountNetTypeOpt = 'all' | NetType.NetType

export const accountCurrencyType = (
  address?: string,
  tokenType?: TokenType,
  l1Network?: L1Network,
) => {
  if (!address) return CurrencyType.default
  if (!tokenType) {
    return accountNetType(address) === NetType.MAINNET ||
      l1Network === 'solana_dev'
      ? CurrencyType.default
      : CurrencyType.testNetworkToken
  }
  // If token type is passed in, we need to check if to return testnet token or default token
  switch (tokenType) {
    default:
    case TokenType.Hnt:
      return accountNetType(address) === NetType.MAINNET ||
        l1Network === 'solana_dev'
        ? CurrencyType.default
        : CurrencyType.testNetworkToken
    case TokenType.Hst:
      return CurrencyType.security
    case TokenType.Iot:
      // TODO: Add testnet IOT token
      return CurrencyType.iot
    case TokenType.Mobile:
      // TODO: Add testnet Mobile token
      return CurrencyType.mobile
  }
}

export const networkCurrencyType = (netType?: NetType.NetType) => {
  return netType === NetType.TESTNET
    ? CurrencyType.testNetworkToken
    : CurrencyType.default
}

export const accountNetType = (address?: string) => {
  if (!address || !Address.isValid(address)) return NetType.MAINNET
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

type EllipsizeOpts = {
  numChars?: number
}

export const ellipsizeAddress = (address: string, options?: EllipsizeOpts) => {
  const numChars = options?.numChars || 8
  return [address.slice(0, numChars), address.slice(-numChars)].join('...')
}

export const formatAccountAlias = (
  opts?: {
    alias: string
    netType?: NetType.NetType
  } | null,
) => {
  if (!opts) return ''
  const { alias, netType } = opts
  return `${netType === NetType.TESTNET ? '🚧 ' : ''}${alias}`
}

export const getJazzSeed = (address: string | undefined) => {
  if (!address || !Address.isValid(address)) return

  const hexVal = utils.bs58ToBin(address).toString('hex')
  return parseInt(hexVal.slice(-8), 16)
}
