import { Ticker } from '@helium/currency'
import * as web3 from '@solana/web3.js'
import { Nft, NftWithToken, Sft, SftWithToken } from '@metaplex-foundation/js'
import { Mints } from '../store/slices/walletRestApi'

export type SolPayment = {
  destination: string
  mint: string
  multisigAuthority: string
  signers: string[]
  source: string
  tokenAmount: web3.TokenAmount
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
