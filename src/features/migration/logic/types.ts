// Structural types describing only the fields the pure logic consumes.
// Real client objects (blockchain-api oRPC) satisfy these by shape.

export type SignerRole = 'source' | 'destination'

// A migratable token as returned by tokens.getBalances (subset).
export type MigratableToken = {
  mint: string
  balance: string // raw integer string
  decimals: number
  uiAmount: number
  symbol?: string
  name?: string
}

// A raw wallet ATA holding, from useBalance().tokenAccounts.
export type WalletHolding = {
  mint: string
  balance: number // raw integer amount
  decimals: number
}

export type SelectableToken = {
  mint: string
  label: string
  decimals: number
  maxRaw: string // full balance, raw integer string
  maxUi: string // full balance, human-readable
}

export type HoldingsClassification = {
  migratableTokens: SelectableToken[]
  leftBehindMints: string[] // mints the wallet holds (nonzero) but cannot migrate
}
