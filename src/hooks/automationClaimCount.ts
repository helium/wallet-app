// numTransactions drops when a claim is removed; nextTransactionId only rises
export const claimCountFromCronJob = (cronJob: {
  numTransactions: number
}): number => cronJob.numTransactions

// The wallet's RPC can lag the node that confirmed the transactions. Read the
// cron job at or after the highest slot of the batch, and retry while the RPC
// catches up.
export const readClaimCountAfter = async ({
  signatures,
  getSignatureStatuses,
  readClaimCount,
  sleep,
  attempts = 3,
  delayMs = 1000,
}: {
  signatures: string[]
  getSignatureStatuses: (
    signatures: string[],
  ) => Promise<({ slot: number } | null)[]>
  readClaimCount: (minContextSlot?: number) => Promise<number | null>
  sleep: (ms: number) => Promise<unknown>
  attempts?: number
  delayMs?: number
}): Promise<number | null> => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const isLastAttempt = attempt === attempts
    if (attempt > 1) await sleep(delayMs)
    try {
      const txStatuses = signatures.length
        ? await getSignatureStatuses(signatures)
        : []
      const slots = txStatuses.flatMap((txStatus) =>
        txStatus ? [txStatus.slot] : [],
      )
      const allStatusesFound = slots.length === txStatuses.length
      if (allStatusesFound || isLastAttempt) {
        const count = await readClaimCount(
          allStatusesFound && slots.length ? Math.max(...slots) : undefined,
        )
        if (count !== null) return count
      }
    } catch (error) {
      if (isLastAttempt) throw error
    }
  }
  return null
}
