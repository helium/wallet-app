import { SolanaSignAndSendTransactionInput } from '@solana/wallet-standard-features'
import { Transaction, VersionedTransaction } from '@solana/web3.js'

export type DeserializedTransaction = {
  transaction: Transaction | VersionedTransaction
  chain: string
  options: unknown
  isVersioned: boolean
}

export const deserializeTransactionInputs = async (
  inputs: SolanaSignAndSendTransactionInput[],
): Promise<{
  transactions: DeserializedTransaction[]
  isVersioned: boolean
}> => {
  let isVersioned = false

  const transactions = await Promise.all(
    inputs.map(async ({ transaction, chain, options }) => {
      const tx = new Uint8Array(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.keys(transaction).map((k) => (transaction as any)[k]),
      )

      try {
        VersionedTransaction.deserialize(tx)
        isVersioned = true
      } catch {
        isVersioned = false
      }

      return {
        transaction: isVersioned
          ? VersionedTransaction.deserialize(tx)
          : Transaction.from(tx),
        chain,
        options,
        isVersioned,
      }
    }),
  )

  return { transactions, isVersioned }
}

// web3.js 1.x can only serialize legacy and v0 transactions for signing
export const UNSUPPORTED_VERSION_ERROR =
  'Transaction version is not supported yet'

// TODO: drop this cast once @helium/onboarding 5.0.5 ships
// (https://github.com/helium/helium-js/pull/385). Its .d.ts references
// jito-ts's web3.js 1.77 ambient types, which mask 1.99's and omit version 1.
export const hasUnsupportedTransaction = (
  transactions: DeserializedTransaction[],
) =>
  transactions.some(({ transaction }) => {
    if (!(transaction instanceof VersionedTransaction)) return false
    const { version } = transaction.message as { version: number | 'legacy' }
    return version !== 'legacy' && version !== 0
  })
