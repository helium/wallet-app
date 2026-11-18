import { isQuoteExpiredError } from '../quoteExpired'

// The oRPC client throws ORPCError, which extends Error and carries the
// server's message. @orpc/client is ESM-only, so Jest cannot load it here.
describe('isQuoteExpiredError', () => {
  it('matches the blockchain-api quote-expired refusal', () => {
    const error = new Error(
      "Quote expired: the current route's minimum output is below the quote's; refresh the quote",
    )
    expect(isQuoteExpiredError(error)).toBe(true)
  })

  it('does not match other swap errors', () => {
    expect(isQuoteExpiredError(new Error('No routes found'))).toBe(false)
    expect(isQuoteExpiredError(new Error('Swap tx not generated'))).toBe(false)
  })

  it('does not match values that are not errors', () => {
    expect(isQuoteExpiredError('Quote expired')).toBe(false)
    expect(isQuoteExpiredError(undefined)).toBe(false)
  })
})
