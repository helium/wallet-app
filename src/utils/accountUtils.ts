import Address, { NetTypes as NetType, utils } from '@helium/address'
import { CurrencyType, Ticker } from '@helium/currency'
import Bcrypt from 'bcrypt-react-native'
import { PublicKey } from '@solana/web3.js'
import {
  JsonMetadata,
  Metadata,
  Metaplex,
  Nft,
  NftWithToken,
  Sft,
  SftWithToken,
} from '@metaplex-foundation/js'
import bs58 from 'bs58'
import { TokenType } from '../types/activity'

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

/**
 * Returns the account's collectables
 * @param pubKey public key of the account
 * @param metaplex metaplex connection
 * @returns collectables
 */
export const getCollectables = async (
  pubKey: PublicKey,
  metaplex: Metaplex,
) => {
  const collectables = (await metaplex
    .nfts()
    .findAllByOwner({ owner: pubKey })
    .run()) as Metadata<JsonMetadata<string>>[]

  return collectables
}

/**
 * Returns the account's collectables with metadata
 * @param collectables collectables without metadata
 * @param metaplex metaplex connection
 * @returns collectables with metadata
 */
export const getCollectablesMetadata = async (
  collectables: Metadata<JsonMetadata<string>>[],
  metaplex: Metaplex,
) => {
  const collectablesWithMetadata = await Promise.all(
    collectables.map(async (col) => {
      const json = await (await fetch(col.uri)).json()
      const metadata = await metaplex.nfts().load({ metadata: col }).run()
      return { ...metadata, json }
    }),
  )

  return collectablesWithMetadata
}

/**
 * Returns the account's collectables grouped by token type
 * @param collectables collectables with metadata
 * @returns grouped collecables by token type
 */
export const groupCollectables = (
  collectables: (Sft | SftWithToken | Nft | NftWithToken)[],
) => {
  const collectablesGroupedByName = collectables.reduce((acc, cur) => {
    const { symbol } = cur.json as any
    if (!acc[symbol]) {
      acc[symbol] = [cur]
    } else {
      acc[symbol].push(cur)
    }
    return acc
  }, {} as Record<string, (Sft | SftWithToken | Nft | NftWithToken)[]>)

  return collectablesGroupedByName
}
