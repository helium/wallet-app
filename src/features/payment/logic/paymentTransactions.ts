import { getAssociatedTokenAddressSync, NATIVE_MINT } from '@solana/spl-token'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import bs58 from 'bs58'
import { SentItem } from './batchFailure'

// Each payment with the signed transactions that touch the account it pays:
// the payee for SOL, else the payee's token account. The server's merged
// transaction metadata names one recipient only, so the transactions
// themselves are read. A payee loaded from a lookup table touches no
// transaction, which batchFailure treats as unknown.
export const paymentTransactions = <P extends { payee: string }>(
  payments: P[],
  mint: PublicKey,
  transactions: VersionedTransaction[],
): SentItem<P>[] =>
  payments.map((payment) => {
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
