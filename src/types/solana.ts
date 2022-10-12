import * as web3 from '@solana/web3.js'
import { TokenType } from './activity'

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

export const Mint = {
  HNT: new web3.PublicKey('hntg4GdrpMBW8bqs4R2om4stE6uScPRhPKWAarzoWKP'),
  MOBILE: new web3.PublicKey('mob1r1x3raXXoH42RZwxTxgbAuKkBQzTAQqSjkUdZbd'),
  DC: new web3.PublicKey('dcr5SHHfQixyb5YT7J1hgbWvgxvBpn65bpCyx6pTiKo'),
} as const

export const mintToTokenType = (mint: string) => {
  switch (mint) {
    case Mint.DC.toBase58():
      return TokenType.Dc
    case Mint.MOBILE.toBase58():
      return TokenType.Mobile
    case Mint.HNT.toBase58():
    default:
      return TokenType.Hnt
  }
}

export const tokenTypeToMint = (tokenType: TokenType) => {
  switch (tokenType) {
    case TokenType.Dc:
      return Mint.DC
    case TokenType.Mobile:
      return Mint.MOBILE
    case TokenType.Hnt:
    default:
      return Mint.HNT
  }
}
