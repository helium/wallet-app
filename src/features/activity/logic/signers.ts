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
