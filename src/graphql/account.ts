import { gql } from '@apollo/client'

export const ACCOUNT_ACTIVITY_QUERY = gql`
  query AccountActivity($address: String, $cursor: String) {
    accountActivity(address: $address, cursor: $cursor) {
      cursor
      data {
        time
        memo
        type
        hash
        endEpoch
        startEpoch
        height
        seller
        amountToSeller
        rewards {
          account
          amount
          gateway
          type
        }
        payer
        nonce
        fee
        amount
        stakingFee
        stake
        stakeAmount
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

export const ACCOUNTS_REWARDS_SUM_QUERY = gql`
  query AccountRewardsSummary(
    $address: String
    $minTime: String
    $maxTime: String
  ) {
    accountRewardsSum(address: $address, minTime: $minTime, maxTime: $maxTime) {
      data {
        total
        max
        median
        min
        stddev
        sum
      }
      meta {
        maxTime
        minTime
      }
    }
  }
`
