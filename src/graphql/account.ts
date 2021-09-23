import { gql } from '@apollo/client'

export const DATA_QUERY = gql`
  query AccountData($address: String!, $cursor: String) {
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
      }
    }
  }
`
