import { getAssociatedTokenAddressSync, NATIVE_MINT } from '@solana/spl-token'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import bs58 from 'bs58'
import { SentItem } from './batchFailure'

// Each payment with the signed transactions that touch the account it pays:
// the payee for SOL, else the payee's token account. The server's merged
// transaction metadata names one recipient only, so the transactions
// themselves are read. A transaction that uses a lookup table may load any
// payee from it, so in a batch with one every payment maps to every
// transaction: Retry only when all of them failed.
export const paymentTransactions = <P extends { payee: string }>(
  payments: P[],
  mint: PublicKey,
  transactions: VersionedTransaction[],
): SentItem<P>[] => {
  const usesLookupTable = transactions.some(
    (tx) => tx.message.addressTableLookups.length > 0,
  )
  const allSignatures = transactions.map((tx) => bs58.encode(tx.signatures[0]))
  return payments.map((payment) => {
    if (usesLookupTable) return { item: payment, signatures: allSignatures }
    const payee = new PublicKey(payment.payee)
    const destination = mint.equals(NATIVE_MINT)
      ? payee
      : getAssociatedTokenAddressSync(mint, payee, true)
    return {
      item: payment,
      signatures: transactions
        .filter((tx) =>
          tx.message.staticAccountKeys.some((key) => key.equals(destination)),
        )
        .map((tx) => bs58.encode(tx.signatures[0])),
    }
  })
}
