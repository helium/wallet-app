export type AccountBalance = {
  hntBalance: bigint
  iotBalance: bigint
  mobileBalance: bigint
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
