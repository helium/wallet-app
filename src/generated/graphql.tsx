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

export type AccountBalance = {
  __typename?: 'AccountBalance'
  balance: Scalars['Float']
  date: Scalars['String']
  hntBalance: Scalars['Int']
  hntPrice: Scalars['Float']
  iotBalance: Scalars['Int']
  mobileBalance: Scalars['Int']
  stakedHntBalance: Scalars['Int']
}

export type AccountData = {
  __typename?: 'AccountData'
  address: Scalars['String']
  balance: Scalars['Int']
  block?: Maybe<Scalars['Int']>
  dcBalance: Scalars['Int']
  dcNonce: Scalars['Int']
  iotBalance?: Maybe<Scalars['Int']>
  mobileBalance?: Maybe<Scalars['Int']>
  nonce: Scalars['Int']
  secBalance: Scalars['Int']
  secNonce: Scalars['Int']
  speculativeNonce?: Maybe<Scalars['Int']>
  speculativeSecNonce?: Maybe<Scalars['Int']>
  stakedBalance: Scalars['Int']
}

export type Activity = {
  __typename?: 'Activity'
  account?: Maybe<Scalars['String']>
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
  payee?: Maybe<Scalars['String']>
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
  tokenType?: Maybe<TokenType>
  type: Scalars['String']
}

export type ActivityData = {
  __typename?: 'ActivityData'
  cursor?: Maybe<Scalars['String']>
  data?: Maybe<Array<Activity>>
}

export enum CurrencyType {
  Aed = 'AED',
  Ars = 'ARS',
  Aud = 'AUD',
  Bch = 'BCH',
  Bdt = 'BDT',
  Bhd = 'BHD',
  Bits = 'BITS',
  Bmd = 'BMD',
  Bnb = 'BNB',
  Brl = 'BRL',
  Btc = 'BTC',
  Cad = 'CAD',
  Chf = 'CHF',
  Clp = 'CLP',
  Cny = 'CNY',
  Czk = 'CZK',
  Dkk = 'DKK',
  Dot = 'DOT',
  Eos = 'EOS',
  Eth = 'ETH',
  Eur = 'EUR',
  Gbp = 'GBP',
  Hkd = 'HKD',
  Huf = 'HUF',
  Idr = 'IDR',
  Ils = 'ILS',
  Inr = 'INR',
  Jpy = 'JPY',
  Krw = 'KRW',
  Kwd = 'KWD',
  Link = 'LINK',
  Lkr = 'LKR',
  Ltc = 'LTC',
  Mmk = 'MMK',
  Mxn = 'MXN',
  Myr = 'MYR',
  Ngn = 'NGN',
  Nok = 'NOK',
  Nzd = 'NZD',
  Php = 'PHP',
  Pkr = 'PKR',
  Pln = 'PLN',
  Rub = 'RUB',
  Sar = 'SAR',
  Sats = 'SATS',
  Sek = 'SEK',
  Sgd = 'SGD',
  Thb = 'THB',
  Try = 'TRY',
  Twd = 'TWD',
  Uah = 'UAH',
  Usd = 'USD',
  Vef = 'VEF',
  Vnd = 'VND',
  Xag = 'XAG',
  Xau = 'XAU',
  Xdr = 'XDR',
  Xlm = 'XLM',
  Xrp = 'XRP',
  Yfi = 'YFI',
  Zar = 'ZAR',
}

export type CurrentPrices = {
  __typename?: 'CurrentPrices'
  hnt: Scalars['Float']
  iot: Scalars['Float']
  mobile: Scalars['Float']
}

export type FeatureFlags = {
  __typename?: 'FeatureFlags'
  mobileEnabled: Scalars['Boolean']
  wifiBurnMemo?: Maybe<Scalars['String']>
  wifiBurnPayee?: Maybe<Scalars['String']>
  wifiEnabled: Scalars['Boolean']
  wifiFaucetB58?: Maybe<Scalars['String']>
  wifiProfile?: Maybe<Scalars['String']>
}

export type Geocode = {
  __typename?: 'Geocode'
  cityId: Scalars['String']
  longCity: Scalars['String']
  longCountry: Scalars['String']
  longState: Scalars['String']
  longStreet: Scalars['String']
  shortCity: Scalars['String']
  shortCountry: Scalars['String']
  shortState: Scalars['String']
  shortStreet: Scalars['String']
}

export type Hotspot = {
  __typename?: 'Hotspot'
  address: Scalars['String']
  block: Scalars['Int']
  blockAdded: Scalars['Int']
  elevation: Scalars['Int']
  gain: Scalars['Int']
  geocode: Geocode
  lastChangeBlock: Scalars['Int']
  lastPocChallenge: Scalars['Int']
  lat: Scalars['Float']
  lng: Scalars['Float']
  location: Scalars['String']
  locationHex: Scalars['String']
  mode: Scalars['String']
  name: Scalars['String']
  nonce: Scalars['Int']
  owner: Scalars['String']
  payer: Scalars['String']
  rewardScale: Scalars['Float']
  speculativeNonce: Scalars['Int']
  status: Status
  timestampAdded: Scalars['String']
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
  tokenType?: Maybe<TokenType>
}

export type Penalty = {
  __typename?: 'Penalty'
  amount: Scalars['Float']
  height: Scalars['Int']
  type: Scalars['String']
}

export type Prices = {
  __typename?: 'Prices'
  hnt: Pricing
}

export type Pricing = {
  __typename?: 'Pricing'
  aed?: Maybe<Scalars['Float']>
  ars?: Maybe<Scalars['Float']>
  aud?: Maybe<Scalars['Float']>
  bch?: Maybe<Scalars['Float']>
  bdt?: Maybe<Scalars['Float']>
  bhd?: Maybe<Scalars['Float']>
  bits?: Maybe<Scalars['Float']>
  bmd?: Maybe<Scalars['Float']>
  bnb?: Maybe<Scalars['Float']>
  brl?: Maybe<Scalars['Float']>
  btc?: Maybe<Scalars['Float']>
  cad?: Maybe<Scalars['Float']>
  chf?: Maybe<Scalars['Float']>
  clp?: Maybe<Scalars['Float']>
  cny?: Maybe<Scalars['Float']>
  czk?: Maybe<Scalars['Float']>
  dkk?: Maybe<Scalars['Float']>
  dot?: Maybe<Scalars['Float']>
  eos?: Maybe<Scalars['Float']>
  eth?: Maybe<Scalars['Float']>
  eur?: Maybe<Scalars['Float']>
  gbp?: Maybe<Scalars['Float']>
  hkd?: Maybe<Scalars['Float']>
  huf?: Maybe<Scalars['Float']>
  idr?: Maybe<Scalars['Float']>
  ils?: Maybe<Scalars['Float']>
  inr?: Maybe<Scalars['Float']>
  jpy?: Maybe<Scalars['Float']>
  krw?: Maybe<Scalars['Float']>
  kwd?: Maybe<Scalars['Float']>
  link?: Maybe<Scalars['Float']>
  lkr?: Maybe<Scalars['Float']>
  ltc?: Maybe<Scalars['Float']>
  mmk?: Maybe<Scalars['Float']>
  mxn?: Maybe<Scalars['Float']>
  myr?: Maybe<Scalars['Float']>
  ngn?: Maybe<Scalars['Float']>
  nok?: Maybe<Scalars['Float']>
  nzd?: Maybe<Scalars['Float']>
  php?: Maybe<Scalars['Float']>
  pkr?: Maybe<Scalars['Float']>
  pln?: Maybe<Scalars['Float']>
  rub?: Maybe<Scalars['Float']>
  sar?: Maybe<Scalars['Float']>
  sats?: Maybe<Scalars['Float']>
  sek?: Maybe<Scalars['Float']>
  sgd?: Maybe<Scalars['Float']>
  thb?: Maybe<Scalars['Float']>
  try?: Maybe<Scalars['Float']>
  twd?: Maybe<Scalars['Float']>
  uah?: Maybe<Scalars['Float']>
  usd?: Maybe<Scalars['Float']>
  vef?: Maybe<Scalars['Float']>
  vnd?: Maybe<Scalars['Float']>
  xag?: Maybe<Scalars['Float']>
  xau?: Maybe<Scalars['Float']>
  xdr?: Maybe<Scalars['Float']>
  xlm?: Maybe<Scalars['Float']>
  xrp?: Maybe<Scalars['Float']>
  yfi?: Maybe<Scalars['Float']>
  zar?: Maybe<Scalars['Float']>
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
  /** Get account balance history */
  accountBalanceHistory?: Maybe<Array<AccountBalance>>
  /** Get account rewards sum */
  accountRewardsSum?: Maybe<Sum>
  /** Get Current Block Height */
  blockHeight: Scalars['Int']
  /** Get current oracle price */
  currentOraclePrice?: Maybe<OraclePrice>
  /** Get current price */
  currentPrices?: Maybe<CurrentPrices>
  /** Get feature flags */
  featureFlags: FeatureFlags
  /** Get hotspot */
  hotspot: Hotspot
  /** Get is hotspot or validator */
  isHotspotOrValidator: Scalars['Boolean']
  /** Get notifications */
  notifications?: Maybe<Array<Notification>>
  /** Get pending txns */
  pendingTxns?: Maybe<Array<Activity>>
  /**
   * Get coin gecko prices
   * @deprecated Use other price queries and specify currency type
   */
  pricing?: Maybe<Prices>
  /** Get txn config vars */
  txnConfigVars?: Maybe<TxnConfigVars>
  /** Get validator */
  validator: Validator
  /** Get vote result */
  voteResult: VoteResult
  /** Get votes */
  votes: Votes
}

export type RootQueryTypeAccountArgs = {
  address: Scalars['String']
}

export type RootQueryTypeAccountActivityArgs = {
  address: Scalars['String']
  cursor?: InputMaybe<Scalars['String']>
  filter?: InputMaybe<Scalars['String']>
}

export type RootQueryTypeAccountBalanceHistoryArgs = {
  address: Scalars['String']
  currencyType: CurrencyType
}

export type RootQueryTypeAccountRewardsSumArgs = {
  address: Scalars['String']
  maxTime?: InputMaybe<Scalars['String']>
  minTime?: InputMaybe<Scalars['String']>
}

export type RootQueryTypeBlockHeightArgs = {
  address: Scalars['String']
}

export type RootQueryTypeCurrentOraclePriceArgs = {
  address: Scalars['String']
}

export type RootQueryTypeCurrentPricesArgs = {
  address: Scalars['String']
  currencyType: CurrencyType
}

export type RootQueryTypeFeatureFlagsArgs = {
  address: Scalars['String']
}

export type RootQueryTypeHotspotArgs = {
  address: Scalars['String']
  hotspotAddress: Scalars['String']
}

export type RootQueryTypeIsHotspotOrValidatorArgs = {
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

export type RootQueryTypePricingArgs = {
  address: Scalars['String']
}

export type RootQueryTypeTxnConfigVarsArgs = {
  address: Scalars['String']
}

export type RootQueryTypeValidatorArgs = {
  address: Scalars['String']
  validatorAddress: Scalars['String']
}

export type RootQueryTypeVoteResultArgs = {
  address: Scalars['String']
  id: Scalars['String']
}

export type RootQueryTypeVotesArgs = {
  address: Scalars['String']
}

export type Status = {
  __typename?: 'Status'
  height: Scalars['String']
  listenAddrs?: Maybe<Array<Scalars['String']>>
  online: Scalars['String']
  timestamp: Scalars['String']
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

export enum TokenType {
  /** Data Credit */
  Dc = 'dc',
  /** Helium Network Token */
  Hnt = 'hnt',
  /** Helium Security Token */
  Hst = 'hst',
  /** IOT Subnetwork Token */
  Iot = 'iot',
  /** MOBILE Subnetwork Token */
  Mobile = 'mobile',
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

export type Validator = {
  __typename?: 'Validator'
  address: Scalars['String']
  block: Scalars['Int']
  blockAdded: Scalars['Int']
  consensusGroups: Scalars['Int']
  lastHeartbeat: Scalars['Int']
  name: Scalars['String']
  owner: Scalars['String']
  penalties?: Maybe<Array<Penalty>>
  penalty: Scalars['Float']
  stake: Scalars['Int']
  stakeStatus: Scalars['String']
  status: Status
  versionHeartbeat: Scalars['Int']
}

export type Vote = {
  __typename?: 'Vote'
  blocksRemaining: Scalars['Int']
  deadline: Scalars['Int']
  description: Scalars['String']
  id: Scalars['String']
  name: Scalars['String']
  outcomes: Array<VoteOutcome>
  tags: VoteTags
}

export type VoteOutcome = {
  __typename?: 'VoteOutcome'
  address: Scalars['String']
  hntVoted?: Maybe<Scalars['Int']>
  uniqueWallets?: Maybe<Scalars['Int']>
  value: Scalars['String']
}

export type VoteResult = {
  __typename?: 'VoteResult'
  outcomes: Array<VoteOutcome>
  timestamp: Scalars['Int']
}

export type VoteTags = {
  __typename?: 'VoteTags'
  primary?: Maybe<Scalars['String']>
  secondary?: Maybe<Scalars['String']>
}

export type Votes = {
  __typename?: 'Votes'
  active: Array<Vote>
  closed: Array<Vote>
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
      tokenType?: TokenType | null
      account?: string | null
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
      payee?: string | null
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
        tokenType?: TokenType | null
      }> | null
    }> | null
  } | null
}

export type AccountBalanceHistoryQueryVariables = Exact<{
  address: Scalars['String']
  type: CurrencyType
}>

export type AccountBalanceHistoryQuery = {
  __typename?: 'RootQueryType'
  accountBalanceHistory?: Array<{
    __typename?: 'AccountBalance'
    hntBalance: number
    stakedHntBalance: number
    iotBalance: number
    mobileBalance: number
    date: string
    hntPrice: number
    balance: number
  }> | null
  currentPrices?: {
    __typename?: 'CurrentPrices'
    hnt: number
    mobile: number
    iot: number
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
    mobileBalance?: number | null
    iotBalance?: number | null
  } | null
}

export type BlockHeightQueryVariables = Exact<{
  address: Scalars['String']
}>

export type BlockHeightQuery = {
  __typename?: 'RootQueryType'
  blockHeight: number
}

export type FeatureFlagsQueryVariables = Exact<{
  address: Scalars['String']
}>

export type FeatureFlagsQuery = {
  __typename?: 'RootQueryType'
  featureFlags: {
    __typename?: 'FeatureFlags'
    mobileEnabled: boolean
    wifiBurnPayee?: string | null
    wifiBurnMemo?: string | null
    wifiEnabled: boolean
    wifiFaucetB58?: string | null
    wifiProfile?: string | null
  }
}

export type HotspotQueryVariables = Exact<{
  address: Scalars['String']
  hotspotAddress: Scalars['String']
}>

export type HotspotQuery = {
  __typename?: 'RootQueryType'
  hotspot: { __typename?: 'Hotspot'; address: string }
}

export type IsHotspotOrValidatorQueryVariables = Exact<{
  address: Scalars['String']
}>

export type IsHotspotOrValidatorQuery = {
  __typename?: 'RootQueryType'
  isHotspotOrValidator: boolean
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
      tokenType?: TokenType | null
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

export type ValidatorQueryVariables = Exact<{
  address: Scalars['String']
  validatorAddress: Scalars['String']
}>

export type ValidatorQuery = {
  __typename?: 'RootQueryType'
  validator: { __typename?: 'Validator'; address: string }
}

export type VoteResultQueryVariables = Exact<{
  address: Scalars['String']
  id: Scalars['String']
}>

export type VoteResultQuery = {
  __typename?: 'RootQueryType'
  voteResult: {
    __typename?: 'VoteResult'
    timestamp: number
    outcomes: Array<{
      __typename?: 'VoteOutcome'
      value: string
      hntVoted?: number | null
      uniqueWallets?: number | null
      address: string
    }>
  }
}

export type VotesQueryVariables = Exact<{
  address: Scalars['String']
}>

export type VotesQuery = {
  __typename?: 'RootQueryType'
  votes: {
    __typename?: 'Votes'
    active: Array<{
      __typename?: 'Vote'
      id: string
      name: string
      description: string
      deadline: number
      blocksRemaining: number
      tags: {
        __typename?: 'VoteTags'
        primary?: string | null
        secondary?: string | null
      }
      outcomes: Array<{
        __typename?: 'VoteOutcome'
        value: string
        address: string
      }>
    }>
    closed: Array<{
      __typename?: 'Vote'
      id: string
      name: string
      description: string
      deadline: number
      blocksRemaining: number
      tags: {
        __typename?: 'VoteTags'
        primary?: string | null
        secondary?: string | null
      }
      outcomes: Array<{
        __typename?: 'VoteOutcome'
        value: string
        address: string
      }>
    }>
  }
}

export type VoteFragment = {
  __typename?: 'Vote'
  id: string
  name: string
  description: string
  deadline: number
  blocksRemaining: number
  tags: {
    __typename?: 'VoteTags'
    primary?: string | null
    secondary?: string | null
  }
  outcomes: Array<{
    __typename?: 'VoteOutcome'
    value: string
    address: string
  }>
}

export const VoteFragmentDoc = gql`
  fragment Vote on Vote {
    id
    name
    description
    tags {
      primary
      secondary
    }
    outcomes {
      value
      address
    }
    deadline
    blocksRemaining
  }
`
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
        tokenType
        account
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
        payee
        payments {
          payee
          memo
          amount
          tokenType
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
export const AccountBalanceHistoryDocument = gql`
  query accountBalanceHistory($address: String!, $type: CurrencyType!) {
    accountBalanceHistory(address: $address, currencyType: $type) {
      hntBalance
      stakedHntBalance
      iotBalance
      mobileBalance
      date
      hntPrice
      balance
    }
    currentPrices(address: $address, currencyType: $type) {
      hnt
      mobile
      iot
    }
  }
`

/**
 * __useAccountBalanceHistoryQuery__
 *
 * To run a query within a React component, call `useAccountBalanceHistoryQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccountBalanceHistoryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccountBalanceHistoryQuery({
 *   variables: {
 *      address: // value for 'address'
 *      type: // value for 'type'
 *   },
 * });
 */
export function useAccountBalanceHistoryQuery(
  baseOptions: Apollo.QueryHookOptions<
    AccountBalanceHistoryQuery,
    AccountBalanceHistoryQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<
    AccountBalanceHistoryQuery,
    AccountBalanceHistoryQueryVariables
  >(AccountBalanceHistoryDocument, options)
}
export function useAccountBalanceHistoryLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AccountBalanceHistoryQuery,
    AccountBalanceHistoryQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<
    AccountBalanceHistoryQuery,
    AccountBalanceHistoryQueryVariables
  >(AccountBalanceHistoryDocument, options)
}
export type AccountBalanceHistoryQueryHookResult = ReturnType<
  typeof useAccountBalanceHistoryQuery
>
export type AccountBalanceHistoryLazyQueryHookResult = ReturnType<
  typeof useAccountBalanceHistoryLazyQuery
>
export type AccountBalanceHistoryQueryResult = Apollo.QueryResult<
  AccountBalanceHistoryQuery,
  AccountBalanceHistoryQueryVariables
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
      mobileBalance
      iotBalance
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
export const BlockHeightDocument = gql`
  query blockHeight($address: String!) {
    blockHeight(address: $address)
  }
`

/**
 * __useBlockHeightQuery__
 *
 * To run a query within a React component, call `useBlockHeightQuery` and pass it any options that fit your needs.
 * When your component renders, `useBlockHeightQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBlockHeightQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useBlockHeightQuery(
  baseOptions: Apollo.QueryHookOptions<
    BlockHeightQuery,
    BlockHeightQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<BlockHeightQuery, BlockHeightQueryVariables>(
    BlockHeightDocument,
    options,
  )
}
export function useBlockHeightLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    BlockHeightQuery,
    BlockHeightQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<BlockHeightQuery, BlockHeightQueryVariables>(
    BlockHeightDocument,
    options,
  )
}
export type BlockHeightQueryHookResult = ReturnType<typeof useBlockHeightQuery>
export type BlockHeightLazyQueryHookResult = ReturnType<
  typeof useBlockHeightLazyQuery
>
export type BlockHeightQueryResult = Apollo.QueryResult<
  BlockHeightQuery,
  BlockHeightQueryVariables
>
export const FeatureFlagsDocument = gql`
  query FeatureFlags($address: String!) {
    featureFlags(address: $address) {
      mobileEnabled
      wifiBurnPayee
      wifiBurnMemo
      wifiEnabled
      wifiFaucetB58
      wifiProfile
    }
  }
`

/**
 * __useFeatureFlagsQuery__
 *
 * To run a query within a React component, call `useFeatureFlagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFeatureFlagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFeatureFlagsQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useFeatureFlagsQuery(
  baseOptions: Apollo.QueryHookOptions<
    FeatureFlagsQuery,
    FeatureFlagsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<FeatureFlagsQuery, FeatureFlagsQueryVariables>(
    FeatureFlagsDocument,
    options,
  )
}
export function useFeatureFlagsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FeatureFlagsQuery,
    FeatureFlagsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<FeatureFlagsQuery, FeatureFlagsQueryVariables>(
    FeatureFlagsDocument,
    options,
  )
}
export type FeatureFlagsQueryHookResult = ReturnType<
  typeof useFeatureFlagsQuery
>
export type FeatureFlagsLazyQueryHookResult = ReturnType<
  typeof useFeatureFlagsLazyQuery
>
export type FeatureFlagsQueryResult = Apollo.QueryResult<
  FeatureFlagsQuery,
  FeatureFlagsQueryVariables
>
export const HotspotDocument = gql`
  query hotspot($address: String!, $hotspotAddress: String!) {
    hotspot(address: $address, hotspotAddress: $hotspotAddress) {
      address
    }
  }
`

/**
 * __useHotspotQuery__
 *
 * To run a query within a React component, call `useHotspotQuery` and pass it any options that fit your needs.
 * When your component renders, `useHotspotQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHotspotQuery({
 *   variables: {
 *      address: // value for 'address'
 *      hotspotAddress: // value for 'hotspotAddress'
 *   },
 * });
 */
export function useHotspotQuery(
  baseOptions: Apollo.QueryHookOptions<HotspotQuery, HotspotQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<HotspotQuery, HotspotQueryVariables>(
    HotspotDocument,
    options,
  )
}
export function useHotspotLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    HotspotQuery,
    HotspotQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<HotspotQuery, HotspotQueryVariables>(
    HotspotDocument,
    options,
  )
}
export type HotspotQueryHookResult = ReturnType<typeof useHotspotQuery>
export type HotspotLazyQueryHookResult = ReturnType<typeof useHotspotLazyQuery>
export type HotspotQueryResult = Apollo.QueryResult<
  HotspotQuery,
  HotspotQueryVariables
>
export const IsHotspotOrValidatorDocument = gql`
  query isHotspotOrValidator($address: String!) {
    isHotspotOrValidator(address: $address)
  }
`

/**
 * __useIsHotspotOrValidatorQuery__
 *
 * To run a query within a React component, call `useIsHotspotOrValidatorQuery` and pass it any options that fit your needs.
 * When your component renders, `useIsHotspotOrValidatorQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useIsHotspotOrValidatorQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useIsHotspotOrValidatorQuery(
  baseOptions: Apollo.QueryHookOptions<
    IsHotspotOrValidatorQuery,
    IsHotspotOrValidatorQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<
    IsHotspotOrValidatorQuery,
    IsHotspotOrValidatorQueryVariables
  >(IsHotspotOrValidatorDocument, options)
}
export function useIsHotspotOrValidatorLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    IsHotspotOrValidatorQuery,
    IsHotspotOrValidatorQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<
    IsHotspotOrValidatorQuery,
    IsHotspotOrValidatorQueryVariables
  >(IsHotspotOrValidatorDocument, options)
}
export type IsHotspotOrValidatorQueryHookResult = ReturnType<
  typeof useIsHotspotOrValidatorQuery
>
export type IsHotspotOrValidatorLazyQueryHookResult = ReturnType<
  typeof useIsHotspotOrValidatorLazyQuery
>
export type IsHotspotOrValidatorQueryResult = Apollo.QueryResult<
  IsHotspotOrValidatorQuery,
  IsHotspotOrValidatorQueryVariables
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
        tokenType
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
export const ValidatorDocument = gql`
  query validator($address: String!, $validatorAddress: String!) {
    validator(address: $address, validatorAddress: $validatorAddress) {
      address
    }
  }
`

/**
 * __useValidatorQuery__
 *
 * To run a query within a React component, call `useValidatorQuery` and pass it any options that fit your needs.
 * When your component renders, `useValidatorQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useValidatorQuery({
 *   variables: {
 *      address: // value for 'address'
 *      validatorAddress: // value for 'validatorAddress'
 *   },
 * });
 */
export function useValidatorQuery(
  baseOptions: Apollo.QueryHookOptions<ValidatorQuery, ValidatorQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<ValidatorQuery, ValidatorQueryVariables>(
    ValidatorDocument,
    options,
  )
}
export function useValidatorLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ValidatorQuery,
    ValidatorQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<ValidatorQuery, ValidatorQueryVariables>(
    ValidatorDocument,
    options,
  )
}
export type ValidatorQueryHookResult = ReturnType<typeof useValidatorQuery>
export type ValidatorLazyQueryHookResult = ReturnType<
  typeof useValidatorLazyQuery
>
export type ValidatorQueryResult = Apollo.QueryResult<
  ValidatorQuery,
  ValidatorQueryVariables
>
export const VoteResultDocument = gql`
  query voteResult($address: String!, $id: String!) {
    voteResult(address: $address, id: $id) {
      outcomes {
        value
        hntVoted
        uniqueWallets
        address
      }
      timestamp
    }
  }
`

/**
 * __useVoteResultQuery__
 *
 * To run a query within a React component, call `useVoteResultQuery` and pass it any options that fit your needs.
 * When your component renders, `useVoteResultQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useVoteResultQuery({
 *   variables: {
 *      address: // value for 'address'
 *      id: // value for 'id'
 *   },
 * });
 */
export function useVoteResultQuery(
  baseOptions: Apollo.QueryHookOptions<
    VoteResultQuery,
    VoteResultQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<VoteResultQuery, VoteResultQueryVariables>(
    VoteResultDocument,
    options,
  )
}
export function useVoteResultLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    VoteResultQuery,
    VoteResultQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<VoteResultQuery, VoteResultQueryVariables>(
    VoteResultDocument,
    options,
  )
}
export type VoteResultQueryHookResult = ReturnType<typeof useVoteResultQuery>
export type VoteResultLazyQueryHookResult = ReturnType<
  typeof useVoteResultLazyQuery
>
export type VoteResultQueryResult = Apollo.QueryResult<
  VoteResultQuery,
  VoteResultQueryVariables
>
export const VotesDocument = gql`
  query votes($address: String!) {
    votes(address: $address) {
      active {
        ...Vote
      }
      closed {
        ...Vote
      }
    }
  }
  ${VoteFragmentDoc}
`

/**
 * __useVotesQuery__
 *
 * To run a query within a React component, call `useVotesQuery` and pass it any options that fit your needs.
 * When your component renders, `useVotesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useVotesQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useVotesQuery(
  baseOptions: Apollo.QueryHookOptions<VotesQuery, VotesQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<VotesQuery, VotesQueryVariables>(
    VotesDocument,
    options,
  )
}
export function useVotesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<VotesQuery, VotesQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<VotesQuery, VotesQueryVariables>(
    VotesDocument,
    options,
  )
}
export type VotesQueryHookResult = ReturnType<typeof useVotesQuery>
export type VotesLazyQueryHookResult = ReturnType<typeof useVotesLazyQuery>
export type VotesQueryResult = Apollo.QueryResult<
  VotesQuery,
  VotesQueryVariables
>
