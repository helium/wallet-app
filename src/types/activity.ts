export type Activity = {
  account?: null | string
  address?: null | string
  amount?: null | number
  amountToSeller?: null | number
  buyer?: null | string
  elevation?: null | number
  endEpoch?: null | number
  fee?: null | number
  gain?: null | number
  gateway?: null | string
  hash: string
  height?: null | number
  lat?: null | number
  lng?: null | number
  location?: null | string
  memo?: null | string
  newAddress?: null | string
  newOwner?: null | string
  nonce?: null | number
  oldAddress?: null | string
  oldOwner?: null | string
  owner?: null | string
  payments?: null | Array<Payment>
  pending?: null | boolean
  rewards?: null | Array<Reward>
  seller?: null | string
  stake?: null | number
  stakeAmount?: null | number
  stakingFee?: null | number
  startEpoch?: null | number
  time?: null | number
  mint?: null | string
  type: string
}

export type Payment = {
  amount: number
  memo?: null | string
  payee: string
  mint?: null | string
}

export type Reward = {
  account?: null | string
  amount: number
  gateway?: null | string
  type: string
}
