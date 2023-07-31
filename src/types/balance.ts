import Balance, {
  DataCredits,
  IotTokens,
  MobileTokens,
  NetworkTokens,
  SolTokens,
} from '@helium/currency'

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
  dcBalance: Balance<DataCredits>
  formattedDcValue: string
  formattedEscrowDcValue: string
  formattedHntValue: string
  formattedIotValue: string
  formattedMobileValue: string
  formattedSolValue: string
  formattedTotal: string
  hntBalance: Balance<NetworkTokens>
  hntValue: number
  iotBalance: Balance<IotTokens>
  iotValue: number
  mobileBalance: Balance<MobileTokens>
  mobileValue: number
  solBalance: Balance<SolTokens>
  solToken: Omit<TokenAccount, 'mint'>
  solValue: number
}
