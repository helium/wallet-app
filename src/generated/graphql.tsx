import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'

export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
const defaultOptions = {}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
}

export type AccountData = {
  __typename?: 'AccountData'
  address: Scalars['String']
  balance: Scalars['Int']
  block?: Maybe<Scalars['Int']>
  dcBalance: Scalars['Int']
  dcNonce: Scalars['Int']
  nonce: Scalars['Int']
  secBalance: Scalars['Int']
  secNonce: Scalars['Int']
  speculativeNonce?: Maybe<Scalars['Int']>
  speculativeSecNonce?: Maybe<Scalars['Int']>
  stakedBalance: Scalars['Int']
}

export type Activity = {
  __typename?: 'Activity'
  amount?: Maybe<Scalars['Int']>
  amountToSeller?: Maybe<Scalars['Int']>
  endEpoch?: Maybe<Scalars['Int']>
  fee?: Maybe<Scalars['Int']>
  hash: Scalars['String']
  height: Scalars['Int']
  memo?: Maybe<Scalars['String']>
  nonce?: Maybe<Scalars['Int']>
  payer?: Maybe<Scalars['String']>
  payments?: Maybe<Array<Payment>>
  rewards?: Maybe<Array<Reward>>
  seller?: Maybe<Scalars['String']>
  stake?: Maybe<Scalars['Int']>
  stakeAmount?: Maybe<Scalars['Int']>
  stakingFee?: Maybe<Scalars['Int']>
  startEpoch?: Maybe<Scalars['Int']>
  time: Scalars['Int']
  type: Scalars['String']
}

export type ActivityData = {
  __typename?: 'ActivityData'
  cursor?: Maybe<Scalars['String']>
  data?: Maybe<Array<Activity>>
}

export type OraclePrice = {
  __typename?: 'OraclePrice'
  block: Scalars['Int']
  price: Scalars['Float']
  timestamp: Scalars['String']
}

export type Payment = {
  __typename?: 'Payment'
  amount: Scalars['Int']
  payee: Scalars['String']
}

export type Reward = {
  __typename?: 'Reward'
  account: Scalars['String']
  amount: Scalars['Int']
  gateway: Scalars['String']
  type: Scalars['String']
}

export type RootMutationType = {
  __typename?: 'RootMutationType'
  submitTxn?: Maybe<TxnHash>
}

export type RootMutationTypeSubmitTxnArgs = {
  address: Scalars['String']
  txn: Scalars['String']
}

export type RootQueryType = {
  __typename?: 'RootQueryType'
  /** Get account */
  account?: Maybe<AccountData>
  /** Get account activity */
  accountActivity?: Maybe<ActivityData>
  /** Get account rewards sum */
  accountRewardsSum?: Maybe<Sum>
  /** Get current oracle price */
  currentOraclePrice?: Maybe<OraclePrice>
  /** Get txn config vars */
  txnConfigVars?: Maybe<TxnConfigVars>
}

export type RootQueryTypeAccountArgs = {
  address: Scalars['String']
}

export type RootQueryTypeAccountActivityArgs = {
  address: Scalars['String']
  cursor?: InputMaybe<Scalars['String']>
  filter?: InputMaybe<Scalars['String']>
}

export type RootQueryTypeAccountRewardsSumArgs = {
  address: Scalars['String']
  maxTime?: InputMaybe<Scalars['String']>
  minTime?: InputMaybe<Scalars['String']>
}

export type RootQueryTypeCurrentOraclePriceArgs = {
  address: Scalars['String']
}

export type Sum = {
  __typename?: 'Sum'
  data: SumData
  meta: SumMeta
}

export type SumData = {
  __typename?: 'SumData'
  avg: Scalars['Float']
  max: Scalars['Float']
  median: Scalars['Float']
  min: Scalars['Float']
  stddev: Scalars['Float']
  sum: Scalars['Int']
  total: Scalars['Float']
}

export type SumMeta = {
  __typename?: 'SumMeta'
  maxTime: Scalars['String']
  minTime: Scalars['String']
}

export type TxnConfigVars = {
  __typename?: 'TxnConfigVars'
  dcPayloadSize: Scalars['Int']
  stakingFeeTxnAddGatewayV1: Scalars['Int']
  stakingFeeTxnAssertLocationV1: Scalars['Int']
  txnFeeMultiplier: Scalars['Int']
}

export type TxnHash = {
  __typename?: 'TxnHash'
  hash: Scalars['String']
}

export type AccountActivityQueryVariables = Exact<{
  address: Scalars['String']
  cursor?: InputMaybe<Scalars['String']>
}>

export type AccountActivityQuery = {
  __typename?: 'RootQueryType'
  accountActivity?:
    | {
        __typename?: 'ActivityData'
        cursor?: string | null | undefined
        data?:
          | Array<{
              __typename?: 'Activity'
              time: number
              memo?: string | null | undefined
              type: string
              hash: string
              endEpoch?: number | null | undefined
              startEpoch?: number | null | undefined
              height: number
              seller?: string | null | undefined
              amountToSeller?: number | null | undefined
              payer?: string | null | undefined
              nonce?: number | null | undefined
              fee?: number | null | undefined
              amount?: number | null | undefined
              stakingFee?: number | null | undefined
              stake?: number | null | undefined
              stakeAmount?: number | null | undefined
              rewards?:
                | Array<{
                    __typename?: 'Reward'
                    account: string
                    amount: number
                    gateway: string
                    type: string
                  }>
                | null
                | undefined
              payments?:
                | Array<{
                    __typename?: 'Payment'
                    payee: string
                    amount: number
                  }>
                | null
                | undefined
            }>
          | null
          | undefined
      }
    | null
    | undefined
}

export type AccountRewardsSummaryQueryVariables = Exact<{
  address: Scalars['String']
  minTime?: InputMaybe<Scalars['String']>
  maxTime?: InputMaybe<Scalars['String']>
}>

export type AccountRewardsSummaryQuery = {
  __typename?: 'RootQueryType'
  accountRewardsSum?:
    | {
        __typename?: 'Sum'
        data: {
          __typename?: 'SumData'
          total: number
          max: number
          median: number
          min: number
          stddev: number
          sum: number
        }
        meta: { __typename?: 'SumMeta'; maxTime: string; minTime: string }
      }
    | null
    | undefined
}

export type AccountQueryVariables = Exact<{
  address: Scalars['String']
}>

export type AccountQuery = {
  __typename?: 'RootQueryType'
  account?:
    | {
        __typename?: 'AccountData'
        address: string
        balance: number
        block?: number | null | undefined
        dcBalance: number
        dcNonce: number
        nonce: number
        secBalance: number
        secNonce: number
        speculativeNonce?: number | null | undefined
        speculativeSecNonce?: number | null | undefined
        stakedBalance: number
      }
    | null
    | undefined
}

export type HeliumDataQueryVariables = Exact<{
  address: Scalars['String']
}>

export type HeliumDataQuery = {
  __typename?: 'RootQueryType'
  currentOraclePrice?:
    | { __typename?: 'OraclePrice'; price: number }
    | null
    | undefined
}

export type SubmitTxnMutationVariables = Exact<{
  address: Scalars['String']
  txn: Scalars['String']
}>

export type SubmitTxnMutation = {
  __typename?: 'RootMutationType'
  submitTxn?: { __typename?: 'TxnHash'; hash: string } | null | undefined
}

export type TxnConfigVarsQueryVariables = Exact<{ [key: string]: never }>

export type TxnConfigVarsQuery = {
  __typename?: 'RootQueryType'
  txnConfigVars?:
    | {
        __typename?: 'TxnConfigVars'
        txnFeeMultiplier: number
        stakingFeeTxnAddGatewayV1: number
        stakingFeeTxnAssertLocationV1: number
        dcPayloadSize: number
      }
    | null
    | undefined
}

export const AccountActivityDocument = gql`
  query AccountActivity($address: String!, $cursor: String) {
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

/**
 * __useAccountActivityQuery__
 *
 * To run a query within a React component, call `useAccountActivityQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccountActivityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccountActivityQuery({
 *   variables: {
 *      address: // value for 'address'
 *      cursor: // value for 'cursor'
 *   },
 * });
 */
export function useAccountActivityQuery(
  baseOptions: Apollo.QueryHookOptions<
    AccountActivityQuery,
    AccountActivityQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<AccountActivityQuery, AccountActivityQueryVariables>(
    AccountActivityDocument,
    options,
  )
}
export function useAccountActivityLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AccountActivityQuery,
    AccountActivityQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<
    AccountActivityQuery,
    AccountActivityQueryVariables
  >(AccountActivityDocument, options)
}
export type AccountActivityQueryHookResult = ReturnType<
  typeof useAccountActivityQuery
>
export type AccountActivityLazyQueryHookResult = ReturnType<
  typeof useAccountActivityLazyQuery
>
export type AccountActivityQueryResult = Apollo.QueryResult<
  AccountActivityQuery,
  AccountActivityQueryVariables
>
export const AccountRewardsSummaryDocument = gql`
  query AccountRewardsSummary(
    $address: String!
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

/**
 * __useAccountRewardsSummaryQuery__
 *
 * To run a query within a React component, call `useAccountRewardsSummaryQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccountRewardsSummaryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccountRewardsSummaryQuery({
 *   variables: {
 *      address: // value for 'address'
 *      minTime: // value for 'minTime'
 *      maxTime: // value for 'maxTime'
 *   },
 * });
 */
export function useAccountRewardsSummaryQuery(
  baseOptions: Apollo.QueryHookOptions<
    AccountRewardsSummaryQuery,
    AccountRewardsSummaryQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<
    AccountRewardsSummaryQuery,
    AccountRewardsSummaryQueryVariables
  >(AccountRewardsSummaryDocument, options)
}
export function useAccountRewardsSummaryLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AccountRewardsSummaryQuery,
    AccountRewardsSummaryQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<
    AccountRewardsSummaryQuery,
    AccountRewardsSummaryQueryVariables
  >(AccountRewardsSummaryDocument, options)
}
export type AccountRewardsSummaryQueryHookResult = ReturnType<
  typeof useAccountRewardsSummaryQuery
>
export type AccountRewardsSummaryLazyQueryHookResult = ReturnType<
  typeof useAccountRewardsSummaryLazyQuery
>
export type AccountRewardsSummaryQueryResult = Apollo.QueryResult<
  AccountRewardsSummaryQuery,
  AccountRewardsSummaryQueryVariables
>
export const AccountDocument = gql`
  query Account($address: String!) {
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
  }
`

/**
 * __useAccountQuery__
 *
 * To run a query within a React component, call `useAccountQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccountQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useAccountQuery(
  baseOptions: Apollo.QueryHookOptions<AccountQuery, AccountQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    options,
  )
}
export function useAccountLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AccountQuery,
    AccountQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    options,
  )
}
export type AccountQueryHookResult = ReturnType<typeof useAccountQuery>
export type AccountLazyQueryHookResult = ReturnType<typeof useAccountLazyQuery>
export type AccountQueryResult = Apollo.QueryResult<
  AccountQuery,
  AccountQueryVariables
>
export const HeliumDataDocument = gql`
  query HeliumData($address: String!) {
    currentOraclePrice(address: $address) {
      price
    }
  }
`

/**
 * __useHeliumDataQuery__
 *
 * To run a query within a React component, call `useHeliumDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useHeliumDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHeliumDataQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useHeliumDataQuery(
  baseOptions: Apollo.QueryHookOptions<
    HeliumDataQuery,
    HeliumDataQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<HeliumDataQuery, HeliumDataQueryVariables>(
    HeliumDataDocument,
    options,
  )
}
export function useHeliumDataLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    HeliumDataQuery,
    HeliumDataQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<HeliumDataQuery, HeliumDataQueryVariables>(
    HeliumDataDocument,
    options,
  )
}
export type HeliumDataQueryHookResult = ReturnType<typeof useHeliumDataQuery>
export type HeliumDataLazyQueryHookResult = ReturnType<
  typeof useHeliumDataLazyQuery
>
export type HeliumDataQueryResult = Apollo.QueryResult<
  HeliumDataQuery,
  HeliumDataQueryVariables
>
export const SubmitTxnDocument = gql`
  mutation submitTxn($address: String!, $txn: String!) {
    submitTxn(address: $address, txn: $txn) {
      hash
    }
  }
`
export type SubmitTxnMutationFn = Apollo.MutationFunction<
  SubmitTxnMutation,
  SubmitTxnMutationVariables
>

/**
 * __useSubmitTxnMutation__
 *
 * To run a mutation, you first call `useSubmitTxnMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitTxnMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitTxnMutation, { data, loading, error }] = useSubmitTxnMutation({
 *   variables: {
 *      address: // value for 'address'
 *      txn: // value for 'txn'
 *   },
 * });
 */
export function useSubmitTxnMutation(
  baseOptions?: Apollo.MutationHookOptions<
    SubmitTxnMutation,
    SubmitTxnMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useMutation<SubmitTxnMutation, SubmitTxnMutationVariables>(
    SubmitTxnDocument,
    options,
  )
}
export type SubmitTxnMutationHookResult = ReturnType<
  typeof useSubmitTxnMutation
>
export type SubmitTxnMutationResult = Apollo.MutationResult<SubmitTxnMutation>
export type SubmitTxnMutationOptions = Apollo.BaseMutationOptions<
  SubmitTxnMutation,
  SubmitTxnMutationVariables
>
export const TxnConfigVarsDocument = gql`
  query txnConfigVars {
    txnConfigVars {
      txnFeeMultiplier
      stakingFeeTxnAddGatewayV1
      stakingFeeTxnAssertLocationV1
      dcPayloadSize
    }
  }
`

/**
 * __useTxnConfigVarsQuery__
 *
 * To run a query within a React component, call `useTxnConfigVarsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTxnConfigVarsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTxnConfigVarsQuery({
 *   variables: {
 *   },
 * });
 */
export function useTxnConfigVarsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    TxnConfigVarsQuery,
    TxnConfigVarsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<TxnConfigVarsQuery, TxnConfigVarsQueryVariables>(
    TxnConfigVarsDocument,
    options,
  )
}
export function useTxnConfigVarsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    TxnConfigVarsQuery,
    TxnConfigVarsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<TxnConfigVarsQuery, TxnConfigVarsQueryVariables>(
    TxnConfigVarsDocument,
    options,
  )
}
export type TxnConfigVarsQueryHookResult = ReturnType<
  typeof useTxnConfigVarsQuery
>
export type TxnConfigVarsLazyQueryHookResult = ReturnType<
  typeof useTxnConfigVarsLazyQuery
>
export type TxnConfigVarsQueryResult = Apollo.QueryResult<
  TxnConfigVarsQuery,
  TxnConfigVarsQueryVariables
>
