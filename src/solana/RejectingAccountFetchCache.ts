import { AccountFetchCache } from '@helium/account-fetch-cache'
import { AccountInfo } from '@solana/web3.js'

// @helium/account-fetch-cache resolves a failed batch with the error
// (its Batcher binds reject to resolve), so every key in the batch reads as
// absent and that null is cached and persisted. Here a failed batch rejects:
// its readers get the error and the next read fetches the keys again.
export class RejectingAccountFetchCache extends AccountFetchCache {
  fetchBatch(): Promise<void> {
    const batcher = this.activeBatches[this.activeBatches.length - 1]
    if (batcher) {
      batcher.reject = (e) => batcher.currentBatchResultReject(e)
    }
    return super.fetchBatch()
  }

  // A read that waits on another read's batch goes on to fetch its own keys
  // when that batch fails
  async awaitAllInFlight(): Promise<Record<string, AccountInfo<Buffer>>> {
    let results: Record<string, AccountInfo<Buffer>> = {}
    for (const batch of this.activeBatches) {
      if (batch.inFlight) {
        try {
          results = { ...(await batch.result), ...results }
        } catch {
          // The batch's own readers get its error
        }
        this.activeBatches = this.activeBatches.filter((b) => b !== batch)
      }
    }
    return results
  }
}
