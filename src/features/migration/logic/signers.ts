import { SignerRole } from './types'

export type TxSigners<T> = {
  signWithSource: (tx: T) => Promise<T>
  signWithDestination: (tx: T) => Promise<T>
}

export type SignableTx<T> = { tx: T; signers: SignerRole[] }

// Sign each transaction with exactly the wallets its metadata names, chaining
// when both are required. Empty signers defaults to source. Runs sequentially
// so a chained tx keeps both partial signatures. Assumes each signer sets only
// its own signature slot (true for anchorProvider.wallet + Privy provider).
export const signBatchTransactions = async <T>(
  items: SignableTx<T>[],
  { signWithSource, signWithDestination }: TxSigners<T>,
): Promise<T[]> => {
  const result: T[] = []
  // Sequential by design (see above): each chained tx must keep both partial
  // signatures, so we cannot parallelize with Promise.all here.
  // eslint-disable-next-line no-restricted-syntax
  for (const item of items) {
    const roles = item.signers.length
      ? item.signers
      : (['source'] as SignerRole[])
    let signed = item.tx
    if (roles.includes('source')) {
      // eslint-disable-next-line no-await-in-loop
      signed = await signWithSource(signed)
    }
    if (roles.includes('destination')) {
      // eslint-disable-next-line no-await-in-loop
      signed = await signWithDestination(signed)
    }
    result.push(signed)
  }
  return result
}
