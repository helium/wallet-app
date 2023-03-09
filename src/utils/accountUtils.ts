import Address, { NetTypes as NetType, utils } from '@helium/address'
import { CurrencyType, Ticker } from '@helium/currency'
import Bcrypt from 'bcrypt-react-native'
import { PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'
import { round } from 'lodash'
import BigNumber from 'bignumber.js'

export type L1Network = 'helium' | 'solana'

export type AccountNetTypeOpt = 'all' | NetType.NetType

export const heliumAddressToSolAddress = (heliumAddress: string) => {
  try {
    if (typeof heliumAddress !== 'string') return ''
    const heliumPK = Address.fromB58(heliumAddress).publicKey
    const pk = new PublicKey(heliumPK)
    return pk.toBase58()
  } catch {
    return ''
  }
}

export const solAddressIsValid = (address: string) => {
  try {
    const pubKey = new PublicKey(address)
    return PublicKey.isOnCurve(pubKey)
  } catch {
    return false
  }
}

export const heliumAddressIsValid = (address: string) => {
  try {
    return Address.isValid(address)
  } catch {
    return false
  }
}

export const accountCurrencyType = (
  address?: string,
  tokenType?: Ticker,
  l1Network?: L1Network,
) => {
  if (!address) return CurrencyType.default
  if (!tokenType) {
    return accountNetType(address) === NetType.MAINNET || l1Network === 'solana'
      ? CurrencyType.default
      : CurrencyType.testNetworkToken
  }
  // If token type is passed in, we need to check if to return testnet token or default token
  switch (tokenType) {
    default:
    case 'HNT':
      return accountNetType(address) === NetType.MAINNET ||
        l1Network === 'solana'
        ? CurrencyType.default
        : CurrencyType.testNetworkToken
    case 'HST':
      return CurrencyType.security
    case 'IOT':
      return CurrencyType.iot
    case 'MOBILE':
      return CurrencyType.mobile
    case 'DC':
      return CurrencyType.dataCredit
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
  if (!address) {
    console.error('Jazz seed is invalid')
    return
  }

  let hexVal = ''
  if (heliumAddressIsValid(address)) {
    hexVal = utils.bs58ToBin(address).toString('hex')
  } else if (solAddressIsValid(address)) {
    const decoded = bs58.decode(address)
    hexVal = Buffer.from(decoded).toString('hex')
  }

  return parseInt(hexVal.slice(-8), 16)
}

export const formatLargeNumber = (number: BigNumber) => {
  const BILLION = new BigNumber(1000000000)
  const MILLION = new BigNumber(1000000)
  const THOUSAND = new BigNumber(1000)

  if (number.gte(BILLION)) {
    return [round(number.div(BILLION).toNumber(), 2), 'B'].join('')
  }
  if (number.gte(MILLION)) {
    return [round(number.div(MILLION).toNumber(), 2), 'M'].join('')
  }
  if (number.gte(THOUSAND)) {
    return [round(number.div(THOUSAND).toNumber(), 2), 'K'].join('')
  }

  return number.toString()
}
