export type Activity = {
  address?: null | string
  amount?: null | number
  buyer?: null | string
  feePayer?: string
  fee?: null | number
  gateway?: null | string
  hash: string
  height?: null | number
  payments?: null | Array<Payment>
  pending?: null | boolean
  time?: null | number
  type: string
}

export type Payment = {
  amount: number
  memo?: null | string
  owner: string
  mint?: null | string
}
