import BN from 'bn.js'

// The pyth HNT feed counts as stale after 10 minutes, so poll well inside that.
export const ORACLE_POLL_INTERVAL = 1000 * 5 * 60 // 5 minutes
export const ORACLE_RETRY_INTERVAL = 1000 * 30 // 30 seconds
export const ORACLE_MAX_AGE = 1000 * 10 * 60 // 10 minutes

export type OraclePrice = {
  price: BN
  // Seconds since the epoch, as published by the oracle.
  publishTime: number
}

export const isOraclePriceFresh = (
  oraclePrice: OraclePrice | undefined,
  now: number,
): oraclePrice is OraclePrice =>
  !!oraclePrice && now - oraclePrice.publishTime * 1000 <= ORACLE_MAX_AGE
