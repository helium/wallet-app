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
  address?: Maybe<Scalars['String']>
  amount?: Maybe<Scalars['Int']>
  amountToSeller?: Maybe<Scalars['Int']>
  buyer?: Maybe<Scalars['String']>
  elevation?: Maybe<Scalars['Float']>
  endEpoch?: Maybe<Scalars['Int']>
  fee?: Maybe<Scalars['Int']>
  gain?: Maybe<Scalars['Float']>
  gateway?: Maybe<Scalars['String']>
  hash: Scalars['String']
  height?: Maybe<Scalars['Int']>
  lat?: Maybe<Scalars['Float']>
  lng?: Maybe<Scalars['Float']>
  location?: Maybe<Scalars['String']>
  memo?: Maybe<Scalars['String']>
  newAddress?: Maybe<Scalars['String']>
  newOwner?: Maybe<Scalars['String']>
  nonce?: Maybe<Scalars['Int']>
  oldAddress?: Maybe<Scalars['String']>
  oldOwner?: Maybe<Scalars['String']>
  owner?: Maybe<Scalars['String']>
  payer?: Maybe<Scalars['String']>
  payments?: Maybe<Array<Payment>>
  pending?: Maybe<Scalars['Boolean']>
  rewards?: Maybe<Array<Reward>>
  seller?: Maybe<Scalars['String']>
  stake?: Maybe<Scalars['Int']>
  stakeAmount?: Maybe<Scalars['Int']>
  stakingFee?: Maybe<Scalars['Int']>
  startEpoch?: Maybe<Scalars['Int']>
  time?: Maybe<Scalars['Int']>
  type: Scalars['String']
}

export type ActivityData = {
  __typename?: 'ActivityData'
  cursor?: Maybe<Scalars['String']>
  data?: Maybe<Array<Activity>>
}

export type Notification = {
  __typename?: 'Notification'
  actionTitle?: Maybe<Scalars['String']>
  actionUrl?: Maybe<Scalars['String']>
  body: Scalars['String']
  icon: Scalars['String']
  id: Scalars['Int']
  resource: Scalars['String']
  time: Scalars['String']
  title: Scalars['String']
  type: Scalars['String']
  viewedAt?: Maybe<Scalars['String']>
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
  memo?: Maybe<Scalars['String']>
  payee: Scalars['String']
}

export type Reward = {
  __typename?: 'Reward'
  account?: Maybe<Scalars['String']>
  amount: Scalars['Int']
  gateway?: Maybe<Scalars['String']>
  type: Scalars['String']
}

export type RootMutationType = {
  __typename?: 'RootMutationType'
  submitTxn?: Maybe<TxnHash>
}

export type RootMutationTypeSubmitTxnArgs = {
  address: Scalars['String']
  txn: Scalars['String']
  txnJson?: InputMaybe<Scalars['String']>
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
  /** Get notifications */
  notifications?: Maybe<Array<Notification>>
  /** Get pending txns */
  pendingTxns?: Maybe<Array<Activity>>
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

export type RootQueryTypeNotificationsArgs = {
  address: Scalars['String']
  before?: InputMaybe<Scalars['Int']>
  limit?: InputMaybe<Scalars['Int']>
  resource: Scalars['String']
}

export type RootQueryTypePendingTxnsArgs = {
  address: Scalars['String']
}

export type RootQueryTypeTxnConfigVarsArgs = {
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
  filter?: InputMaybe<Scalars['String']>
}>

export type AccountActivityQuery = {
  __typename?: 'RootQueryType'
  accountActivity?: {
    __typename?: 'ActivityData'
    cursor?: string | null
    data?: Array<{
      __typename?: 'Activity'
      time?: number | null
      memo?: string | null
      type: string
      hash: string
      gateway?: string | null
      address?: string | null
      oldAddress?: string | null
      newAddress?: string | null
      oldOwner?: string | null
      newOwner?: string | null
      lat?: number | null
      lng?: number | null
      gain?: number | null
      elevation?: number | null
      location?: string | null
      owner?: string | null
      buyer?: string | null
      endEpoch?: number | null
      startEpoch?: number | null
      height?: number | null
      seller?: string | null
      amountToSeller?: number | null
      payer?: string | null
      nonce?: number | null
      fee?: number | null
      amount?: number | null
      stakingFee?: number | null
      stake?: number | null
      stakeAmount?: number | null
      rewards?: Array<{
        __typename?: 'Reward'
        account?: string | null
        amount: number
        gateway?: string | null
        type: string
      }> | null
      payments?: Array<{
        __typename?: 'Payment'
        payee: string
        memo?: string | null
        amount: number
      }> | null
    }> | null
  } | null
}

export type AccountRewardsSummaryQueryVariables = Exact<{
  address: Scalars['String']
  minTime?: InputMaybe<Scalars['String']>
  maxTime?: InputMaybe<Scalars['String']>
}>

export type AccountRewardsSummaryQuery = {
  __typename?: 'RootQueryType'
  accountRewardsSum?: {
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
  } | null
}

export type AccountQueryVariables = Exact<{
  address: Scalars['String']
}>

export type AccountQuery = {
  __typename?: 'RootQueryType'
  account?: {
    __typename?: 'AccountData'
    address: string
    balance: number
    block?: number | null
    dcBalance: number
    dcNonce: number
    nonce: number
    secBalance: number
    secNonce: number
    speculativeNonce?: number | null
    speculativeSecNonce?: number | null
    stakedBalance: number
  } | null
}

export type NotificationsQueryVariables = Exact<{
  address: Scalars['String']
  resource: Scalars['String']
  before?: InputMaybe<Scalars['Int']>
  limit?: InputMaybe<Scalars['Int']>
}>

export type NotificationsQuery = {
  __typename?: 'RootQueryType'
  notifications?: Array<{
    __typename?: 'Notification'
    resource: string
    body: string
    icon: string
    title: string
    type: string
    id: number
    viewedAt?: string | null
    time: string
    actionTitle?: string | null
    actionUrl?: string | null
  }> | null
}

export type OracleDataQueryVariables = Exact<{
  address: Scalars['String']
}>

export type OracleDataQuery = {
  __typename?: 'RootQueryType'
  currentOraclePrice?: { __typename?: 'OraclePrice'; price: number } | null
}

export type PendingTxnsQueryVariables = Exact<{
  address: Scalars['String']
}>

export type PendingTxnsQuery = {
  __typename?: 'RootQueryType'
  pendingTxns?: Array<{
    __typename?: 'Activity'
    pending?: boolean | null
    time?: number | null
    memo?: string | null
    type: string
    hash: string
    endEpoch?: number | null
    startEpoch?: number | null
    height?: number | null
    seller?: string | null
    amountToSeller?: number | null
    payer?: string | null
    nonce?: number | null
    fee?: number | null
    amount?: number | null
    stakingFee?: number | null
    stake?: number | null
    stakeAmount?: number | null
    rewards?: Array<{
      __typename?: 'Reward'
      account?: string | null
      amount: number
      gateway?: string | null
      type: string
    }> | null
    payments?: Array<{
      __typename?: 'Payment'
      payee: string
      amount: number
      memo?: string | null
    }> | null
  }> | null
}

export type SubmitTxnMutationVariables = Exact<{
  address: Scalars['String']
  txn: Scalars['String']
  txnJson?: InputMaybe<Scalars['String']>
}>

export type SubmitTxnMutation = {
  __typename?: 'RootMutationType'
  submitTxn?: { __typename?: 'TxnHash'; hash: string } | null
}

export type TxnConfigVarsQueryVariables = Exact<{
  address: Scalars['String']
}>

export type TxnConfigVarsQuery = {
  __typename?: 'RootQueryType'
  txnConfigVars?: {
    __typename?: 'TxnConfigVars'
    txnFeeMultiplier: number
    stakingFeeTxnAddGatewayV1: number
    stakingFeeTxnAssertLocationV1: number
    dcPayloadSize: number
  } | null
}

export const AccountActivityDocument = gql`
  query AccountActivity($address: String!, $cursor: String, $filter: String) {
    accountActivity(address: $address, cursor: $cursor, filter: $filter) {
      cursor
      data {
        time
        memo
        type
        hash
        gateway
        address
        oldAddress
        newAddress
        oldOwner
        newOwner
        lat
        lng
        gain
        elevation
        location
        owner
        buyer
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
          memo
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
 *      filter: // value for 'filter'
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
export const NotificationsDocument = gql`
  query Notifications(
    $address: String!
    $resource: String!
    $before: Int
    $limit: Int
  ) {
    notifications(
      address: $address
      resource: $resource
      before: $before
      limit: $limit
    ) {
      resource
      body
      icon
      title
      type
      id
      viewedAt
      time
      actionTitle
      actionUrl
    }
  }
`

/**
 * __useNotificationsQuery__
 *
 * To run a query within a React component, call `useNotificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useNotificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNotificationsQuery({
 *   variables: {
 *      address: // value for 'address'
 *      resource: // value for 'resource'
 *      before: // value for 'before'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useNotificationsQuery(
  baseOptions: Apollo.QueryHookOptions<
    NotificationsQuery,
    NotificationsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<NotificationsQuery, NotificationsQueryVariables>(
    NotificationsDocument,
    options,
  )
}
export function useNotificationsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    NotificationsQuery,
    NotificationsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<NotificationsQuery, NotificationsQueryVariables>(
    NotificationsDocument,
    options,
  )
}
export type NotificationsQueryHookResult = ReturnType<
  typeof useNotificationsQuery
>
export type NotificationsLazyQueryHookResult = ReturnType<
  typeof useNotificationsLazyQuery
>
export type NotificationsQueryResult = Apollo.QueryResult<
  NotificationsQuery,
  NotificationsQueryVariables
>
export const OracleDataDocument = gql`
  query OracleData($address: String!) {
    currentOraclePrice(address: $address) {
      price
    }
  }
`

/**
 * __useOracleDataQuery__
 *
 * To run a query within a React component, call `useOracleDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useOracleDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOracleDataQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useOracleDataQuery(
  baseOptions: Apollo.QueryHookOptions<
    OracleDataQuery,
    OracleDataQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<OracleDataQuery, OracleDataQueryVariables>(
    OracleDataDocument,
    options,
  )
}
export function useOracleDataLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    OracleDataQuery,
    OracleDataQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<OracleDataQuery, OracleDataQueryVariables>(
    OracleDataDocument,
    options,
  )
}
export type OracleDataQueryHookResult = ReturnType<typeof useOracleDataQuery>
export type OracleDataLazyQueryHookResult = ReturnType<
  typeof useOracleDataLazyQuery
>
export type OracleDataQueryResult = Apollo.QueryResult<
  OracleDataQuery,
  OracleDataQueryVariables
>
export const PendingTxnsDocument = gql`
  query pendingTxns($address: String!) {
    pendingTxns(address: $address) {
      pending
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
        memo
      }
    }
  }
`

/**
 * __usePendingTxnsQuery__
 *
 * To run a query within a React component, call `usePendingTxnsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePendingTxnsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePendingTxnsQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function usePendingTxnsQuery(
  baseOptions: Apollo.QueryHookOptions<
    PendingTxnsQuery,
    PendingTxnsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<PendingTxnsQuery, PendingTxnsQueryVariables>(
    PendingTxnsDocument,
    options,
  )
}
export function usePendingTxnsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    PendingTxnsQuery,
    PendingTxnsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<PendingTxnsQuery, PendingTxnsQueryVariables>(
    PendingTxnsDocument,
    options,
  )
}
export type PendingTxnsQueryHookResult = ReturnType<typeof usePendingTxnsQuery>
export type PendingTxnsLazyQueryHookResult = ReturnType<
  typeof usePendingTxnsLazyQuery
>
export type PendingTxnsQueryResult = Apollo.QueryResult<
  PendingTxnsQuery,
  PendingTxnsQueryVariables
>
export const SubmitTxnDocument = gql`
  mutation submitTxn($address: String!, $txn: String!, $txnJson: String) {
    submitTxn(address: $address, txn: $txn, txnJson: $txnJson) {
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
 *      txnJson: // value for 'txnJson'
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
  query txnConfigVars($address: String!) {
    txnConfigVars(address: $address) {
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
 *      address: // value for 'address'
 *   },
 * });
 */
export function useTxnConfigVarsQuery(
  baseOptions: Apollo.QueryHookOptions<
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
