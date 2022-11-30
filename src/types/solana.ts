import { Ticker } from '@helium/currency'
import {
  JsonMetadata,
  Nft,
  NftWithToken,
  Option,
  Sft,
  SftWithToken,
} from '@metaplex-foundation/js'
import { TokenAmount } from '@solana/web3.js'
import { Mints } from '../store/slices/walletRestApi'

export type SolPayment = {
  destination: string
  mint: string
  multisigAuthority: string
  signers: string[]
  source: string
  tokenAmount: TokenAmount
}
export type SolPaymentInfo = {
  account: string
  mint: string
  source: string
  systemProgram: string
  tokenProgram: string
  wallet: string
}

export const toMintAddress = (symbol: string, mints: Mints) => {
  const ticker = symbol.toUpperCase() as Ticker
  return mints[ticker]
}

export const mintToTicker = (mint: string, mints: Mints) => {
  const found = Object.keys(mints).find((key) => mints[key as Ticker] === mint)
  if (!found) throw new Error('Token type for mint not found')

  return found as Ticker
}

export type Collectable = Sft | SftWithToken | Nft | NftWithToken

type NativeTransfer = {
  fromUserAccount: string
  toUserAccount: string
  amount: number
}

type TokenMetadata = {
  model: string
  name: string
  symbol: string
  uri: string
  json: Option<JsonMetadata<string>> | undefined
}

type TokenTransfer = {
  fromUserAccount: string
  toUserAccount: string
  fromTokenAccount: string
  toTokenAccount: string
  tokenAmount: number
  mint: string
  tokenMetadata?: TokenMetadata
}

type TokenBalanceChange = {
  userAccount: string
  tokenAccount: string
  mint: string
  rawTokenAmount: {
    tokenAmount: string
    decimals: number
  }
}

type TokenPayload = {
  userAccount: string
  tokenAccount: string
  mint: string
  rawTokenAmount: {
    tokenAmount: string
    decimals: number
  }
}

type NativeTokenPayload = {
  account: string
  amount: number
}

export type EnrichedTransaction = {
  description: string
  type: string
  source: string
  fee: number
  signature: string
  slot: number
  timestamp: number
  nativeTransfers: NativeTransfer[]
  tokenTransfers: TokenTransfer[]
  accountData: {
    account: string
    nativeBalanceChange: number
    tokenBalanceChanges: TokenBalanceChange[]
  }
  events: {
    nft: {
      description: string
      type: string
      source: string
      amount: number
      fee: number
      signature: string
      timestamp: number
      saleType: string
      buyer: string
      seller: string
      staker: string
      nfts: {
        mint: string
        tokenStandard: string
      }[]
    }
    swap: {
      nativeInput: NativeTokenPayload
      nativeOutput: NativeTokenPayload
      tokenInputs: TokenPayload[]
      tokenOutputs: TokenPayload[]
      tokenFees: TokenPayload[]
      nativeFees: NativeTokenPayload[]
      innerSwaps: {
        tokenInputs: TokenPayload[]
        tokenOutputs: TokenPayload[]
        tokenFees: TokenPayload[]
        nativeFees: NativeTokenPayload[]
        programInfo: {
          source: string
          account: string
          programName: string
          instructionName: string
        }
      }
    }
  }
}
