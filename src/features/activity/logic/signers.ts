import { VersionedMessage } from '@solana/web3.js'

// Solana does not let a lookup-table address sign, so the signers are the
// first numRequiredSignatures static account keys.
export const signersOf = (message: VersionedMessage): string[] =>
  message.staticAccountKeys
    .slice(0, message.header.numRequiredSignatures)
    .map((key) => key.toBase58())

// The parse endpoints do not promise to answer in request order, so match
// each transaction to its signers by signature, never by array position.
export const attachSigners = <T extends { signature: string }>(
  transactions: T[],
  signed: { signature: string; signers: string[] }[],
): (T & { signers: string[] })[] => {
  const signersBySignature = new Map(
    signed.map(({ signature, signers }) => [signature, signers]),
  )
  return transactions.map((tx) => ({
    ...tx,
    signers: signersBySignature.get(tx.signature) ?? [],
  }))
}
