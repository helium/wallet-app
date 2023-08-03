export type TokenAccount = {
  tokenAccount?: string
  mint: string
  balance: number
  decimals: number
}

export type AccountBalance = {
  hntBalance: number
  iotBalance: number
  mobileBalance: number
  date: string
  hntPrice: number
  balance: number
}

export const TokenArr = [
  'helium',
  'solana',
  'helium-iot',
  'helium-mobile',
] as const
export type Token = typeof TokenArr[number]
export type Prices = Record<Token, Record<string, number>>

export type BalanceInfo = {
  atas: Required<TokenAccount>[]
  formattedDcValue: string
  formattedEscrowDcValue: string
  formattedHntValue: string
  formattedIotValue: string
  formattedMobileValue: string
  formattedSolValue: string
  formattedTotal: string
}
