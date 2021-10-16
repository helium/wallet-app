/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AccountActivity
// ====================================================

export interface AccountActivity_accountActivity_data_rewards {
  __typename: 'Reward'
  account: string
  amount: number
  gateway: string
  type: string
}

export interface AccountActivity_accountActivity_data_payments {
  __typename: 'Payment'
  payee: string
  amount: number
}

export interface AccountActivity_accountActivity_data {
  __typename: 'Activity'
  time: number
  memo: string | null
  type: string
  hash: string
  endEpoch: number | null
  startEpoch: number | null
  height: number
  seller: string | null
  amountToSeller: number | null
  rewards: AccountActivity_accountActivity_data_rewards[] | null
  payer: string | null
  nonce: number | null
  fee: number | null
  amount: number | null
  stakingFee: number | null
  stake: number | null
  stakeAmount: number | null
  payments: AccountActivity_accountActivity_data_payments[] | null
}

export interface AccountActivity_accountActivity {
  __typename: 'ActivityData'
  cursor: string | null
  data: AccountActivity_accountActivity_data[] | null
}

export interface AccountActivity {
  /**
   * Get account activity
   */
  accountActivity: AccountActivity_accountActivity | null
}

export interface AccountActivityVariables {
  address?: string | null
  cursor?: string | null
}
