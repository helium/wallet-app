/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Account
// ====================================================

export interface Account_account {
  __typename: 'AccountData'
  address: string
  balance: number
  block: number
  dcBalance: number
  dcNonce: number
  nonce: number
  secBalance: number
  secNonce: number
  speculativeNonce: number
  speculativeSecNonce: number
  stakedBalance: number
}

export interface Account_accountActivity_data_rewards {
  __typename: 'Reward'
  account: string
  amount: number
  gateway: string
  type: string
}

export interface Account_accountActivity_data_payments {
  __typename: 'Payment'
  payee: string
  amount: number
}

export interface Account_accountActivity_data {
  __typename: 'Activity'
  time: number
  type: string
  hash: string
  endEpoch: number | null
  startEpoch: number | null
  height: number
  rewards: Account_accountActivity_data_rewards[] | null
  payer: string | null
  nonce: number | null
  fee: number | null
  payments: Account_accountActivity_data_payments[] | null
}

export interface Account_accountActivity {
  __typename: 'ActivityData'
  cursor: string | null
  data: Account_accountActivity_data[] | null
}

export interface Account {
  /**
   * Get account
   */
  account: Account_account | null
  /**
   * Get account activity
   */
  accountActivity: Account_accountActivity | null
}

export interface AccountVariables {
  address?: string | null
  cursor?: string | null
}
