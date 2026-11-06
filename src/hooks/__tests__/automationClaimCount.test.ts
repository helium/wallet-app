import { claimCountFromCronJob } from '../automationClaimCount'

describe('claimCountFromCronJob', () => {
  it('counts current claims, not the ever-rising next transaction id', () => {
    const cronJob = { numTransactions: 0, nextTransactionId: 5 }
    expect(claimCountFromCronJob(cronJob)).toBe(0)
  })
})
