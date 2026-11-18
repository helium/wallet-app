// blockchain-api refuses swap.getInstructions with this message when the
// rebuilt route pays out less than the quote promised.
export const isQuoteExpiredError = (error: unknown): boolean =>
  error instanceof Error && error.message.startsWith('Quote expired')
