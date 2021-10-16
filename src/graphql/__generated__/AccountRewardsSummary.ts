/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: AccountRewardsSummary
// ====================================================

export interface AccountRewardsSummary_accountRewardsSum_data {
  __typename: 'SumData'
  total: number
  max: number
  median: number
  min: number
  stddev: number
  sum: number
}

export interface AccountRewardsSummary_accountRewardsSum_meta {
  __typename: 'SumMeta'
  maxTime: string
  minTime: string
}

export interface AccountRewardsSummary_accountRewardsSum {
  __typename: 'Sum'
  data: AccountRewardsSummary_accountRewardsSum_data
  meta: AccountRewardsSummary_accountRewardsSum_meta
}

export interface AccountRewardsSummary {
  /**
   * Get account rewards sum
   */
  accountRewardsSum: AccountRewardsSummary_accountRewardsSum | null
}

export interface AccountRewardsSummaryVariables {
  address?: string | null
  minTime?: string | null
  maxTime?: string | null
}
