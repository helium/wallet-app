import {
  claimCountFromCronJob,
  readClaimCountAfter,
} from '../automationClaimCount'

describe('claimCountFromCronJob', () => {
  it('counts current claims, not the ever-rising next transaction id', () => {
    const cronJob = { numTransactions: 0, nextTransactionId: 5 }
    expect(claimCountFromCronJob(cronJob)).toBe(0)
  })
})

describe('readClaimCountAfter', () => {
  const sleep = () => Promise.resolve()

  it('reads at the highest slot of all statuses', async () => {
    const readClaimCount = jest.fn().mockResolvedValue(1)
    const count = await readClaimCountAfter({
      signatures: ['a', 'b', 'c'],
      getSignatureStatuses: () =>
        Promise.resolve([{ slot: 5 }, { slot: 9 }, { slot: 7 }]),
      readClaimCount,
      sleep,
    })
    expect(count).toBe(1)
    expect(readClaimCount).toHaveBeenCalledWith(9)
  })

  it('waits for a missing status, then reads once with its slot', async () => {
    const getSignatureStatuses = jest
      .fn()
      .mockResolvedValueOnce([null])
      .mockResolvedValueOnce([{ slot: 4 }])
    const readClaimCount = jest.fn().mockResolvedValue(0)
    const count = await readClaimCountAfter({
      signatures: ['a'],
      getSignatureStatuses,
      readClaimCount,
      sleep,
    })
    expect(count).toBe(0)
    expect(readClaimCount).toHaveBeenCalledTimes(1)
    expect(readClaimCount).toHaveBeenCalledWith(4)
  })

  it('reads without a slot when statuses are still missing on the last attempt', async () => {
    const readClaimCount = jest.fn().mockResolvedValue(0)
    const count = await readClaimCountAfter({
      signatures: ['a', 'b'],
      getSignatureStatuses: () => Promise.resolve([{ slot: 3 }, null]),
      readClaimCount,
      sleep,
    })
    expect(count).toBe(0)
    expect(readClaimCount).toHaveBeenCalledTimes(1)
    expect(readClaimCount).toHaveBeenCalledWith(undefined)
  })

  it('retries a read that throws', async () => {
    const readClaimCount = jest
      .fn()
      .mockRejectedValueOnce(new Error('Minimum context slot not reached'))
      .mockResolvedValueOnce(2)
    const count = await readClaimCountAfter({
      signatures: ['a'],
      getSignatureStatuses: () => Promise.resolve([{ slot: 1 }]),
      readClaimCount,
      sleep,
    })
    expect(count).toBe(2)
  })

  it('rejects with the error when every read throws', async () => {
    const error = new Error('RPC down')
    const readClaimCount = jest.fn().mockRejectedValue(error)
    await expect(
      readClaimCountAfter({
        signatures: ['a'],
        getSignatureStatuses: () => Promise.resolve([{ slot: 1 }]),
        readClaimCount,
        sleep,
      }),
    ).rejects.toBe(error)
    expect(readClaimCount).toHaveBeenCalledTimes(3)
  })

  it('resolves null when the cron job is never found', async () => {
    const readClaimCount = jest.fn().mockResolvedValue(null)
    const count = await readClaimCountAfter({
      signatures: ['a'],
      getSignatureStatuses: () => Promise.resolve([{ slot: 1 }]),
      readClaimCount,
      sleep,
    })
    expect(count).toBeNull()
    expect(readClaimCount).toHaveBeenCalledTimes(3)
  })

  it('reads without a slot when there are no signatures', async () => {
    const getSignatureStatuses = jest.fn()
    const readClaimCount = jest.fn().mockResolvedValue(1)
    const count = await readClaimCountAfter({
      signatures: [],
      getSignatureStatuses,
      readClaimCount,
      sleep,
    })
    expect(count).toBe(1)
    expect(getSignatureStatuses).not.toHaveBeenCalled()
    expect(readClaimCount).toHaveBeenCalledWith(undefined)
  })
})
