import Address, { NetTypes as NetType, utils } from '@helium/address'
import { PUBLIC_KEY_LENGTH, PublicKey } from '@solana/web3.js'
import Bcrypt from 'bcrypt-react-native'
import BigNumber from 'bignumber.js'
import bs58 from 'bs58'
import { round } from 'lodash'

export type AccountNetTypeOpt = 'all' | NetType.NetType

export const solAddressToHelium = (solanaAddress: string) => {
  try {
    if (typeof solanaAddress !== 'string') return ''
    const buffer = bs58.decode(solanaAddress)
    const heliumPK = new Address(0, 0, 1, buffer)
    return heliumPK.b58
  } catch (e) {
    return ''
  }
}

export const heliumAddressToSolAddress = (heliumAddress: string) => {
  try {
    if (typeof heliumAddress !== 'string') return ''
    const heliumPK = Address.fromB58(heliumAddress).publicKey
    const pk = bs58.encode(heliumPK)
    return new PublicKey(pk).toBase58()
  } catch {
    return ''
  }
}

export const solAddressIsValid = (address: string) => {
  try {
    const pubKey = new PublicKey(address)
    return pubKey.toBuffer().length === PUBLIC_KEY_LENGTH
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

  if (number.lt(new BigNumber(0.01))) {
    return number.toString()
  }

  return Number(number.toFixed(2)).toString()
}
