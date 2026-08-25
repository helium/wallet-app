import { VisibleTokenAccount } from '../../account/logic/visibleTokens'

// Structural types describing only the fields the pure logic consumes.
// Real client objects (blockchain-api oRPC) satisfy these by shape.

export type SignerRole = 'source' | 'destination'

// One serialized transaction as returned by / submitted to the migrate API.
// metadata is optional, but the API always includes type & description when it
// is present; signers is defaulted by signersOrDefault so it stays optional.
export type MigrationTransaction = {
  serializedTransaction: string
  metadata?: {
    type: string
    description: string
    signers?: SignerRole[]
  } & Record<string, unknown>
}

// A batch payload: the shape the migrate API returns and that transactions
// .submit accepts back.
export type TransactionData = {
  transactions: MigrationTransaction[]
  parallel: boolean
  tag?: string
}

// A raw wallet ATA holding, from useBalance().tokenAccounts. frozen is absent
// on state persisted before that field existed, which reads as not frozen.
export type WalletHolding = VisibleTokenAccount & {
  frozen?: boolean
}

export type SelectableToken = {
  mint: string
  label: string
  decimals: number
  maxUi: string // full balance, human-readable
}

export type HoldingsClassification = {
  migratableTokens: SelectableToken[]
  leftBehindMints: string[] // mints the wallet holds (nonzero) but cannot migrate
}
