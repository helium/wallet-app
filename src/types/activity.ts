export type Activity = {
  account?: string
  address?: string
  amount?: number
  amountToSeller?: number
  buyer?: string
  elevation?: number
  endEpoch?: number
  fee?: number
  gain?: number
  gateway?: string
  hash: string
  height?: number
  lat?: number
  lng?: number
  location?: string
  memo?: string
  newAddress?: string
  newOwner?: string
  nonce?: number
  oldAddress?: string
  oldOwner?: string
  owner?: string
  payee?: string
  payer?: string
  payments?: Array<Payment>
  pending?: boolean
  rewards?: Array<Reward>
  seller?: string
  stake?: number
  stakeAmount?: number
  stakingFee?: number
  startEpoch?: number
  time?: number
  tokenType?: TokenType
  type: string
}

export type Payment = {
  __typename?: 'Payment'
  amount: number
  memo?: string
  payee: string
  tokenType?: TokenType
}

export type Reward = {
  __typename?: 'Reward'
  account?: string
  amount: number
  gateway?: string
  type: string
}

export enum TokenType {
  Dc = 'dc',
  Hnt = 'hnt',
  Hst = 'hst',
  Iot = 'iot',
  Mobile = 'mobile',
  Sol = 'sol',
}
