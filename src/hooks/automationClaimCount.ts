// numTransactions drops when a claim is removed; nextTransactionId only rises
export const claimCountFromCronJob = (cronJob: {
  numTransactions: number
}): number => cronJob.numTransactions
