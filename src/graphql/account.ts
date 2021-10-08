import { gql } from '@apollo/client'

export const ACCOUNT_WALLET_QUERY = gql`
  query Account($address: String, $cursor: String) {
    account(address: $address) {
      address
      balance
      block
      dcBalance
      dcNonce
      nonce
      secBalance
      secNonce
      speculativeNonce
      speculativeSecNonce
      stakedBalance
    }
    accountActivity(address: $address, cursor: $cursor) {
      cursor
      data {
        time
        type
        hash
        endEpoch
        startEpoch
        height
        rewards {
          account
          amount
          gateway
          type
        }
        payer
        nonce
        fee
        payments {
          payee
          amount
        }
      }
    }
  }
`

export const ACCOUNTS_WALLET_QUERY = gql`
  query Accounts($addresses: [String]) {
    accounts(addresses: $addresses) {
      address
      balance
      block
      dcBalance
      dcNonce
      nonce
      secBalance
      secNonce
      speculativeNonce
      speculativeSecNonce
      stakedBalance
    }
  }
`
