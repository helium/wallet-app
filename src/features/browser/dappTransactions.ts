import { SolanaSignAndSendTransactionInput } from '@solana/wallet-standard-features'
import { VersionedTransaction } from '@solana/web3.js'

export type DeserializedTransaction = {
  transaction: VersionedTransaction
  chain: string
  options: unknown
}

export const deserializeTransactionInputs = async (
  inputs: SolanaSignAndSendTransactionInput[],
): Promise<{
  transactions: DeserializedTransaction[]
}> => {
  const transactions = await Promise.all(
    inputs.map(async ({ transaction, chain, options }) => {
      const tx = new Uint8Array(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.keys(transaction).map((k) => (transaction as any)[k]),
      )

      // The sign sheet decodes with VersionedTransaction only, so decode the
      // same way here. It reads legacy bytes too.
      const decoded = VersionedTransaction.deserialize(tx)

      return {
        transaction: decoded,
        chain,
        options,
      }
    }),
  )

  return { transactions }
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
    const { version } = transaction.message as { version: number | 'legacy' }
    return version !== 'legacy' && version !== 0
  })

// Runs the sends in order and stops at the first failure. A failure after an
// earlier send was accepted by the RPC names the signatures already
// submitted, so the dApp does not retry the whole batch as if nothing
// happened.
export const sendInSequence = async <T>(
  items: T[],
  send: (item: T) => Promise<string>,
): Promise<string[]> => {
  const sent: string[] = []
  // eslint-disable-next-line no-restricted-syntax
  for (const item of items) {
    try {
      // eslint-disable-next-line no-await-in-loop
      sent.push(await send(item))
    } catch (e) {
      if (sent.length === 0) throw e
      throw new Error(
        `Sent ${sent.length} of ${items.length} transactions (${sent.join(
          ', ',
        )}), then failed: ${(e as Error).message}`,
      )
    }
  }
  return sent
}
