import { needsWalletClaim, shouldAddWalletClaim } from '../automationClaimCount'

describe('needsWalletClaim', () => {
  it.each([
    [true, 0, true],
    [true, 1, false],
    [true, null, false],
    [true, undefined, false],
    [false, 0, false],
  ])(
    'hasExistingAutomation %s, claimCount %s -> %s',
    (hasExistingAutomation, claimCount, expected) => {
      expect(needsWalletClaim(hasExistingAutomation, claimCount)).toBe(expected)
    },
  )
})

describe('shouldAddWalletClaim', () => {
  it.each([
    [0, true],
    [1, false],
    [null, false],
    [undefined, false],
  ])('claimCount %s -> %s', (claimCount, expected) => {
    expect(shouldAddWalletClaim(claimCount)).toBe(expected)
  })
})
