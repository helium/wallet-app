import { AccountFetchCache } from '@helium/account-fetch-cache'
import { AccountInfo, Connection } from '@solana/web3.js'
import { AsyncAccountCache } from './AsyncAccountCache'

type Batcher = AccountFetchCache['activeBatches'][number]
type SearchResult = Awaited<ReturnType<AccountFetchCache['searchAndWatch']>>

// @helium/account-fetch-cache resolves a failed batch with the error
// (its Batcher binds reject to resolve), so every key in the batch reads as
// absent and that null is cached and persisted. Here a failed batch rejects:
// its readers get the error and the next read fetches the keys again.
export class RejectingAccountFetchCache extends AccountFetchCache {
  constructor(args: ConstructorParameters<typeof AccountFetchCache>[0]) {
    super(args)
    const { connection, commitment } = args
    const oldGetMultipleAccountsInfo = this.oldGetMultipleAccountsInfo
    if (oldGetMultipleAccountsInfo) {
      // The lib's Promise.all skips the 30 s dispose of the resolved keys when one key's batch rejects
      connection.getMultipleAccountsInfo = async (publicKeys, com) => {
        if (
          (com || connection.commitment) === commitment ||
          typeof (com || connection.commitment) === 'undefined'
        ) {
          const res = await Promise.allSettled(
            publicKeys.map((k) => this.searchAndWatch(k)),
          )
          setTimeout(() => {
            res.forEach((r) => {
              if (r.status === 'fulfilled') r.value[1]()
            })
          }, 30 * 1000)
          const failed = res.find(
            (r): r is PromiseRejectedResult => r.status === 'rejected',
          )
          if (failed) throw failed.reason
          return res.map(
            (r) =>
              (r as PromiseFulfilledResult<SearchResult>).value[0]?.account ||
              null,
          )
        }
        return oldGetMultipleAccountsInfo(publicKeys, com)
      }
    }
  }

  // Readers that await the batch get its error; a batch with no reader,
  // such as a forceRequery read's pending batch, raises no unhandled rejection
  private rejectOnFailure(batcher: Batcher) {
    // eslint-disable-next-line no-param-reassign -- the batch is the lib's, patched in place
    batcher.reject = (e) => batcher.currentBatchResultReject(e)
    batcher.result?.catch(() => {})
  }

  fetchBatch(): Promise<void> {
    const batcher = this.activeBatches[this.activeBatches.length - 1]
    if (batcher) this.rejectOnFailure(batcher)
    return super.fetchBatch()
  }

  // A batch still in its debounce window rejects on close instead of caching null
  close(): void {
    if (this.timeout) clearTimeout(this.timeout)
    this.timeout = null
    this.activeBatches.forEach((batcher) => this.rejectOnFailure(batcher))
    super.close()
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

export const createAccountFetchCache = (
  connection: Connection,
  cache: AsyncAccountCache,
) =>
  new RejectingAccountFetchCache({
    connection,
    delay: 100,
    commitment: 'confirmed',
    missingRefetchDelay: 60 * 1000,
    extendConnection: true,
    cache,
  })
