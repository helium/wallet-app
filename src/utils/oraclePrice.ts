import BN from 'bn.js'

// The pyth HNT feed counts as stale after 10 minutes, so poll well inside that.
export const ORACLE_POLL_INTERVAL = 1000 * 5 * 60 // 5 minutes
export const ORACLE_RETRY_INTERVAL = 1000 * 30 // 30 seconds
export const ORACLE_MAX_AGE = 1000 * 10 * 60 // 10 minutes
export const ORACLE_FETCH_TIMEOUT = 1000 * 20 // 20 seconds

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

// Rejects with `message` if `promise` has not settled within `ms`.
export const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
