import BN from 'bn.js'
import { isOraclePriceFresh } from '../oraclePrice'

const PUBLISHED_AT_SECS = 1_700_000_000
const PUBLISHED_AT_MS = PUBLISHED_AT_SECS * 1000
const price = { price: new BN(500_000), publishTime: PUBLISHED_AT_SECS }

describe('isOraclePriceFresh', () => {
  it('is false when there is no price', () => {
    expect(isOraclePriceFresh(undefined, PUBLISHED_AT_MS)).toBe(false)
  })

  it('is true for a price published under 10 minutes ago', () => {
    expect(isOraclePriceFresh(price, PUBLISHED_AT_MS + 9 * 60 * 1000)).toBe(
      true,
    )
  })

  it('is true at exactly 10 minutes old', () => {
    expect(isOraclePriceFresh(price, PUBLISHED_AT_MS + 10 * 60 * 1000)).toBe(
      true,
    )
  })

  it('is false once the price is older than 10 minutes', () => {
    expect(
      isOraclePriceFresh(price, PUBLISHED_AT_MS + 10 * 60 * 1000 + 1),
    ).toBe(false)
  })
})
