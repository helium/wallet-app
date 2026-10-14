import BN from 'bn.js'
import { isOraclePriceFresh, withTimeout } from '../oraclePrice'

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

describe('withTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('resolves with the value when the promise settles in time', async () => {
    const result = withTimeout(Promise.resolve(42), 20_000, 'timed out')
    await expect(result).resolves.toBe(42)
    expect(jest.getTimerCount()).toBe(0)
  })

  it('passes through a rejection that comes in time', async () => {
    const result = withTimeout(
      Promise.reject(new Error('rpc failed')),
      20_000,
      'timed out',
    )
    await expect(result).rejects.toThrow('rpc failed')
    expect(jest.getTimerCount()).toBe(0)
  })

  it('rejects with the message once the time runs out', async () => {
    let rejected = false
    const result = withTimeout(new Promise(() => {}), 20_000, 'timed out')
    result.catch(() => {
      rejected = true
    })
    jest.advanceTimersByTime(19_999)
    await Promise.resolve()
    expect(rejected).toBe(false)
    jest.advanceTimersByTime(1)
    await expect(result).rejects.toThrow('timed out')
  })
})
