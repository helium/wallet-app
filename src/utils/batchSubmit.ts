/* eslint-disable max-classes-per-file */
import type { TransactionData } from '@helium/blockchain-api'
import type { useBlockchainApi } from '../storage/BlockchainApiProvider'

export type BatchStatus =
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'expired'
  | 'partial'

export type TerminalStatus = Exclude<BatchStatus, 'pending'>

/** One status for a set of batches: pending until all land, then the shared status, else partial. */
export const mergeBatchStatuses = (
  statuses: BatchStatus[],
): BatchStatus | undefined => {
  if (statuses.some((s) => s === 'pending')) return 'pending'
  const [first] = statuses
  return statuses.every((s) => s === first) ? first : 'partial'
}

export type BatchClient = Pick<
  ReturnType<typeof useBlockchainApi>,
  'transactions'
>

export class PollTimeoutError extends Error {
  readonly batchId: string

  constructor(batchId: string) {
    super('Transaction polling timeout')
    this.batchId = batchId
  }
}

/** One GET /transactions/{id} read: the batch status and each transaction's. */
type BatchRead = {
  status: BatchStatus
  transactions: { signature: string; status: string }[]
}

/**
 * How long a transaction must keep reading `expired` before that is final.
 *
 * The server does not treat `expired` as settled (batch-status.ts keeps it
 * out of SETTLED_STATUSES): it infers it from a blockhash that left range,
 * "a batch can land in its last valid block", and every GET reads the cluster
 * again. One read takes the signature statuses and the blockhash validity in
 * parallel, so a transaction that landed in its last valid block can read
 * `expired` once and `confirmed` on a later read. A blockhash that is out of
 * range lets no later block include the transaction, so only read skew
 * between RPC nodes, a few slots, can cause that flip. 10 seconds is about 25
 * slots, and five re-reads at the 2 second poll interval.
 */
export const EXPIRED_CONFIRM_MS = 10000

/**
 * Makes the settle rule for one batch's reads. Pass every read of that batch
 * through the returned function, in order. A status other than `pending` in
 * its result is final:
 * - a transaction reads `pending` until it has read `expired` for
 *   EXPIRED_CONFIRM_MS;
 * - a batch that is not `confirmed` reads `pending` while any transaction
 *   does. The server reports `partial` or `failed` once one transaction
 *   failed, even with others still pending.
 */
export const createBatchView = () => {
  const expiredSince = new Map<string, number>()

  return <T extends BatchRead>(read: T): T => {
    const transactions = read.transactions.map((tx) => {
      if (tx.status !== 'expired') {
        expiredSince.delete(tx.signature)
        return tx
      }
      const since = expiredSince.get(tx.signature) ?? Date.now()
      expiredSince.set(tx.signature, since)
      return Date.now() - since >= EXPIRED_CONFIRM_MS
        ? tx
        : { ...tx, status: 'pending' }
    })
    const settled =
      read.status === 'confirmed' ||
      transactions.every((tx) => tx.status !== 'pending')
    return { ...read, status: settled ? read.status : 'pending', transactions }
  }
}

export const pollForCompletion = async (
  client: BatchClient,
  batchId: string,
  pollIntervalMs = 2000,
  maxPollTime = 60000,
): Promise<{ status: TerminalStatus; signatures: string[] }> => {
  const startTime = Date.now()
  const view = createBatchView()

  while (Date.now() - startTime < maxPollTime) {
    const result = view(
      // eslint-disable-next-line no-await-in-loop
      await client.transactions.get({
        id: batchId,
        commitment: 'confirmed',
      }),
    )

    if (result.status !== 'pending') {
      return {
        status: result.status,
        signatures: result.transactions?.map((t) => t.signature) ?? [],
      }
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  throw new PollTimeoutError(batchId)
}

export type PageFailure =
  | { kind: 'batch'; status: Exclude<TerminalStatus, 'confirmed'> }
  | { kind: 'timeout' }
  /** The server returned no transactions but said more remain. */
  | { kind: 'empty' }
  | { kind: 'submit'; cause: unknown }
  | { kind: 'rejected'; cause: unknown }
  | { kind: 'sign'; cause: unknown }
  | { kind: 'request'; cause: unknown }

export type PageFailureInfo = {
  failure: PageFailure
  /** 1-based page that failed. */
  page: number
  /** Pages that confirmed before the failed one. */
  confirmedCount: number
  /** Rewards network, for claims. */
  network?: string
}

export class PagedSubmitError extends Error {
  readonly failure: PageFailure

  readonly page: number

  readonly confirmedCount: number

  readonly network?: string

  constructor(message: string, info: PageFailureInfo) {
    super(message)
    this.failure = info.failure
    this.page = info.page
    this.confirmedCount = info.confirmedCount
    this.network = info.network
  }
}

type Page = { transactionData: TransactionData; hasMore?: boolean }

export type PagedSubmitDeps<P extends Page> = {
  /** Prompts the user and signs. A rejection is thrown as is. */
  signPage: (page: P) => Promise<TransactionData>
  /** Submits a signed page and returns its batch id. */
  submitBatch: (signed: TransactionData) => Promise<string>
  pollBatch: (
    batchId: string,
  ) => Promise<{ status: TerminalStatus; signatures: string[] }>
  /** Fetches the next page. Without it, the first page is the only one. */
  nextPage?: () => Promise<P>
  /** Poll the last page too. When false, the caller tracks it (for example on a status screen). */
  waitForLastPage: boolean
  /** Rewards network, for claims. Copied onto the error. */
  network?: string
  describeFailure: (info: PageFailureInfo) => string
}

// The submit error codes the server throws only before it sends anything: the
// blockhash probe, the pre-send simulation, and the Jito bundle simulation
// (the bundle is atomic and is sent only after it simulates).
const UNSENT_CODES = ['BLOCKHASH_EXPIRED', 'SIMULATION_FAILED']

// A definite rejection: the batch was not sent. Only a defined error with one
// of the codes above proves that. The server throws BAD_REQUEST both before
// any send and for every error after sending started, so a BAD_REQUEST, like
// a 5xx, a network error or an unknown code, leaves the outcome unknown.
export const isRejection = (err: unknown): boolean => {
  const { defined, code } = (err ?? {}) as { defined?: unknown; code?: unknown }
  return (
    defined === true && typeof code === 'string' && UNSENT_CODES.includes(code)
  )
}

/**
 * Signs and submits pages until the server stops sending `hasMore`. Every
 * page before the last must confirm before the next one is fetched. A
 * failed, expired, partial or timed-out page stops the loop with a
 * PagedSubmitError, and so does an empty page that says more remain. A
 * submit error becomes kind 'submit', except a definite rejection (see
 * isRejection), which becomes kind 'rejected'.
 */
export const submitPages = async <P extends Page>(
  first: P,
  deps: PagedSubmitDeps<P>,
): Promise<{ batchIds: string[]; signatures: string[] }> => {
  const batchIds: string[] = []
  const signatures: string[] = []
  let confirmedCount = 0
  let page = 1
  let current = first
  const { nextPage } = deps

  const fail = (failure: PageFailure) => {
    const info = { failure, page, confirmedCount, network: deps.network }
    return new PagedSubmitError(deps.describeFailure(info), info)
  }

  const waitFor = async (batchId: string) => {
    try {
      return await deps.pollBatch(batchId)
    } catch {
      // The batch was sent, so any poll error leaves it in an unknown state.
      throw fail({ kind: 'timeout' })
    }
  }

  while (current.transactionData.transactions.length > 0) {
    let signed: TransactionData
    try {
      // eslint-disable-next-line no-await-in-loop
      signed = await deps.signPage(current)
    } catch (cause) {
      // Before any batch is sent, a sign error (a user rejection) is thrown as
      // is. After one, it goes through fail so the copy reports the sent pages.
      if (batchIds.length > 0) throw fail({ kind: 'sign', cause })
      throw cause
    }

    let batchId: string
    try {
      // eslint-disable-next-line no-await-in-loop
      batchId = await deps.submitBatch(signed)
    } catch (cause) {
      throw fail(
        isRejection(cause)
          ? { kind: 'rejected', cause }
          : { kind: 'submit', cause },
      )
    }
    batchIds.push(batchId)

    const isLastPage = !current.hasMore || !nextPage
    if (!isLastPage || deps.waitForLastPage) {
      // eslint-disable-next-line no-await-in-loop
      const outcome = await waitFor(batchId)
      if (outcome.status !== 'confirmed') {
        throw fail({ kind: 'batch', status: outcome.status })
      }
      confirmedCount += 1
      signatures.push(...outcome.signatures)
    }

    if (isLastPage) break
    page += 1
    try {
      // eslint-disable-next-line no-await-in-loop
      current = await nextPage()
    } catch (cause) {
      throw fail({ kind: 'request', cause })
    }
  }

  // An empty page that still says more remain is a server fault. Returning
  // here would report work the server never delivered as done.
  if (current.transactionData.transactions.length === 0 && current.hasMore) {
    throw fail({ kind: 'empty' })
  }

  return { batchIds, signatures }
}

type Translate = (key: string, options?: Record<string, unknown>) => string

// The copy ends the reason with its own period, so drop one from the message.
const reasonOf = (cause: unknown) =>
  (cause instanceof Error ? cause.message : String(cause)).replace(/\.$/, '')

const optionsFor = (failure: PageFailure): Record<string, unknown> => {
  switch (failure.kind) {
    case 'submit':
    case 'rejected':
    case 'sign':
    case 'request':
      return {
        reason: reasonOf(failure.cause),
        interpolation: { escapeValue: false },
      }
    case 'batch':
    case 'timeout':
    case 'empty':
      return {}
    default: {
      const unhandled: never = failure
      return unhandled
    }
  }
}

/**
 * User-facing copy for a failed page. Page 1 gets the plain copy, without a
 * page number. `sentBefore` counts batches an earlier run (an earlier claim
 * network) sent that may still be pending.
 */
export const describePageFailure = (
  t: Translate,
  { failure, page, confirmedCount, network }: PageFailureInfo,
  sentBefore = 0,
): string => {
  const name = failure.kind === 'batch' ? failure.status : failure.kind
  const options = optionsFor(failure)
  const onFirstPage = page === 1
  const key = `transactions.pagedSubmit.${name}${onFirstPage ? '' : 'Page'}`
  if (!onFirstPage) options.page = page

  return [
    network && t('transactions.pagedSubmit.network', { network }),
    Object.keys(options).length ? t(key, options) : t(key),
    confirmedCount > 0 &&
      t('transactions.pagedSubmit.confirmedBefore', { count: confirmedCount }),
    sentBefore > 0 &&
      t('transactions.pagedSubmit.sentBefore', { count: sentBefore }),
  ]
    .filter(Boolean)
    .join(' ')
}
