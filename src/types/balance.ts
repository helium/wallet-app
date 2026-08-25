export type TokenAccount = {
  tokenAccount?: string
  mint: string
  balance: number
  decimals: number
  // Frozen accounts (e.g. Data Credits) can't be transferred, so flows that
  // move tokens must skip them. Absent on state written before this field
  // existed, which reads as not frozen.
  frozen: boolean
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
export type Token = (typeof TokenArr)[number]
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
