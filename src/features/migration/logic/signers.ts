import { SignerRole } from './types'

// The migrate API omits `signers` for txs that only need the source wallet.
// Everything that consumes tx metadata defaults an empty/missing list to
// ['source'] — this is the single place that fallback lives.
export const signersOrDefault = (metadata?: {
  signers?: SignerRole[]
}): SignerRole[] =>
  metadata?.signers?.length ? metadata.signers : (['source'] as SignerRole[])

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
    const roles = signersOrDefault({ signers: item.signers })
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
