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

export const TERMINAL_STATUSES: BatchStatus[] = [
  'confirmed',
  'failed',
  'expired',
  'partial',
]

const isTerminal = (status: string): status is TerminalStatus =>
  (TERMINAL_STATUSES as string[]).includes(status)

/** One status for a set of batches: pending until all land, then the shared status, else partial. */
export const mergeBatchStatuses = (
  statuses: BatchStatus[],
): BatchStatus | undefined => {
  if (statuses.some((s) => !isTerminal(s))) return 'pending'
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

export const pollForCompletion = async (
  client: BatchClient,
  batchId: string,
  pollIntervalMs = 2000,
  maxPollTime = 60000,
): Promise<{ status: TerminalStatus; signatures: string[] }> => {
  const startTime = Date.now()

  while (Date.now() - startTime < maxPollTime) {
    // eslint-disable-next-line no-await-in-loop
    const result = await client.transactions.get({
      id: batchId,
      commitment: 'confirmed',
    })

    if (isTerminal(result.status)) {
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

// A 4xx other than 408 (timeout), 409 (duplicate: already sent) or 429
// (rate limit) is a definite rejection: the batch was not sent. A 400 whose
// error data names a failedTransactionIndex above 0 is not: the transactions
// before that index may have been sent.
export const isRejection = (err: unknown): boolean => {
  const status = (err as { status?: number } | null)?.status
  const failedIndex = (
    err as { data?: { failedTransactionIndex?: unknown } } | null
  )?.data?.failedTransactionIndex
  return (
    typeof status === 'number' &&
    status >= 400 &&
    status < 500 &&
    status !== 408 &&
    status !== 409 &&
    status !== 429 &&
    !(typeof failedIndex === 'number' && failedIndex > 0)
  )
}

/**
 * Signs and submits pages until the server stops sending `hasMore`. Every
 * page before the last must confirm before the next one is fetched. A
 * failed, expired, partial or timed-out page stops the loop with a
 * PagedSubmitError. A submit error becomes kind 'submit', except a definite
 * 4xx rejection, which becomes kind 'rejected'.
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
