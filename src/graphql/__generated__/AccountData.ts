/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AccountData
// ====================================================

export interface AccountData_account {
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

export interface AccountData_accountActivity_data {
  __typename: 'AccountActivity'
  time: number
  type: string
  hash: string
}

export interface AccountData_accountActivity {
  __typename: 'AccountActivityData'
  cursor: string | null
  data: (AccountData_accountActivity_data | null)[] | null
}

export interface AccountData {
  /**
   * Get account
   */
  account: AccountData_account | null
  /**
   * Get account activity
   */
  accountActivity: AccountData_accountActivity | null
}

export interface AccountDataVariables {
  address: string
  cursor?: string | null
}
