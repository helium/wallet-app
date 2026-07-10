import { resendBackoffSeconds, shouldShowSupport } from '../retry'

describe('resendBackoffSeconds', () => {
  it('starts at 30s and doubles per resend', () => {
    expect(resendBackoffSeconds(0)).toBe(30)
    expect(resendBackoffSeconds(1)).toBe(60)
    expect(resendBackoffSeconds(2)).toBe(120)
    expect(resendBackoffSeconds(3)).toBe(240)
  })

  it('caps at 300s once doubling exceeds it', () => {
    expect(resendBackoffSeconds(4)).toBe(300)
    expect(resendBackoffSeconds(10)).toBe(300)
  })

  it('is monotonic non-decreasing across successive resends', () => {
    // Each resend (handleResend) advances the count by one, so the gating
    // window the user waits through must never shrink between attempts.
    const schedule = [0, 1, 2, 3, 4, 5, 6].map(resendBackoffSeconds)
    const sorted = [...schedule].sort((a, b) => a - b)
    expect(schedule).toEqual(sorted)
  })

  it('caps exactly at the resend index where doubling first exceeds 300', () => {
    expect(resendBackoffSeconds(3)).toBe(240) // last uncapped value
    expect(resendBackoffSeconds(4)).toBe(300) // first capped value
    expect(resendBackoffSeconds(4)).toBeLessThan(30 * 2 ** 4)
  })
})

describe('shouldShowSupport', () => {
  it('stays hidden until the third failed attempt', () => {
    expect(shouldShowSupport(0)).toBe(false)
    expect(shouldShowSupport(1)).toBe(false)
    expect(shouldShowSupport(2)).toBe(false)
  })

  it('shows from the third failed attempt onward', () => {
    expect(shouldShowSupport(3)).toBe(true)
    expect(shouldShowSupport(4)).toBe(true)
  })
})
