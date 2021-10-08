/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: Accounts
// ====================================================

export interface Accounts_accounts {
  __typename: 'AccountData'
  address: string
  balance: number
  block: number | null
  dcBalance: number
  dcNonce: number
  nonce: number
  secBalance: number
  secNonce: number
  speculativeNonce: number | null
  speculativeSecNonce: number | null
  stakedBalance: number
}

export interface Accounts {
  /**
   * Get accounts
   */
  accounts: (Accounts_accounts | null)[] | null
}

export interface AccountsVariables {
  addresses?: (string | null)[] | null
}
