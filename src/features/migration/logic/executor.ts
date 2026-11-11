import { EXPIRED_CONFIRM_MS, isRejection } from '../../../utils/batchSubmit'
import defaultSleep from '../../../utils/sleep'
import { summarizeBatch, BatchStatus } from './batches'
import {
  MigrateInput,
  MigrationSession,
  PendingTransaction,
  RunStatus,
  SignatureTally,
} from './session'
import { TransactionData } from './types'

export type MigrateOutput = {
  transactionData: TransactionData
  hasMore?: boolean
  nextParams?: MigrateInput
}

export type ExecutorProgress =
  | { phase: 'requesting'; batch: number }
  | { phase: 'signing'; batch: number; count: number }
  | { phase: 'submitting'; batch: number }
  | { phase: 'confirming'; batch: number }

// What the cluster knows of one signature, null when it has never seen it.
export type SignatureStatus = {
  err: unknown
  confirmationStatus?: string
} | null

export type ExecutorDeps<TSigned = unknown> = {
  requestMigrate: (input: MigrateInput) => Promise<MigrateOutput>
  signBatch: (data: TransactionData) => Promise<TSigned[]>
  submitBatch: (
    signed: TSigned[],
    data: TransactionData,
  ) => Promise<{ batchId: string }>
  // A transaction must read `expired` only once that is final (see
  // createBatchView): summarizeBatch counts an expired transaction as failed.
  pollStatus: (batchId: string) => Promise<BatchStatus>
  persist: (session: MigrationSession) => Promise<void>
  onProgress: (progress: ExecutorProgress) => void
  // Translated copy for a page that has no transactions but says more remain.
  emptyPageMessage: string
  // The signature and blockhash of each signed transaction, in order.
  describeSigned: (signed: TSigned[]) => PendingTransaction[]
  // Direct cluster reads, for a page whose submit outcome is unknown. The
  // status read must search the transaction history, and the blockhash read
  // must use the `confirmed` commitment (at `finalized` a young blockhash
  // reads invalid).
  getSignatureStatuses: (signatures: string[]) => Promise<SignatureStatus[]>
  isBlockhashValid: (blockhash: string) => Promise<boolean>
  // Injectable so retry backoff is instant in tests.
  sleep?: (ms: number) => Promise<void>
}

export type RunOutcome = { status: RunStatus } & SignatureTally

const now = (): number => Date.now()

// A retry only helps for a transient failure; a permanent one (client-side
// rejection like a validation miss or an allowlist denial) should surface
// immediately, not after three backoffs. oRPC errors carry an HTTP `status`:
// 4xx are permanent, except 408 (timeout) and 429 (rate limit) which are worth
// retrying. A missing status means a network-level error — transient.
const isRetryable = (err: unknown): boolean => {
  const status = (err as { status?: number } | null)?.status
  if (typeof status !== 'number') return true
  if (status === 408 || status === 429) return true
  return status < 400 || status >= 500
}

// Retry a transient async op with exponential backoff. Used for the RPC-facing
// migrate/submit calls so a flaky network doesn't abort an otherwise-fine run.
// A permanent error short-circuits the loop and throws on the first attempt.
const withRetry = async <T>(
  fn: () => Promise<T>,
  sleep: (ms: number) => Promise<unknown>,
  attempts = 3,
  baseDelayMs = 500,
): Promise<T> => {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt >= attempts - 1 || !isRetryable(err)) break
      // eslint-disable-next-line no-await-in-loop
      await sleep(baseDelayMs * 2 ** attempt)
    }
  }
  throw lastError
}

export type RunOptions = {
  // Set when resuming a session whose last batch went 'pending' (submitted but
  // unconfirmed). The run re-polls this batch to terminal before re-requesting
  // so an in-flight token transfer can't be rebuilt and double-sent.
  pendingBatchId?: string
  // Set when resuming a session that saved a signed page but no batch id: the
  // submit may have sent it. The run checks these signatures on the cluster
  // before it requests anything.
  pendingTransactions?: PendingTransaction[]
  // The input after that batch or page (null: it was the last page). Once it
  // confirms cleanly, the run moves on instead of re-requesting its page.
  pendingNextInput?: MigrateInput | null
  // Set when resuming a saved session: the page its nextInput requests and the
  // signatures it already confirmed, so the resumed run's snapshots keep both.
  startPage?: number
  priorConfirmedSignatures?: string[]
}

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err)

type PageRow = 'confirmed' | 'failed' | 'pending' | 'expired'

export const runMigration = async <TSigned = unknown>(
  originalInput: MigrateInput,
  deps: ExecutorDeps<TSigned>,
  opts: RunOptions = {},
): Promise<RunOutcome> => {
  const confirmedSignatures: string[] = [
    ...(opts.priorConfirmedSignatures ?? []),
  ]
  const failedSignatures: string[] = []
  const sleep = deps.sleep ?? defaultSleep
  let input = originalInput
  let batch = opts.startPage ?? 1
  let inFlightNext = opts.pendingNextInput
  // The signed page that may be in flight. It stays saved, with or without a
  // batch id, until a batch read lists its transactions (see settleSentPage).
  let inFlightPage = opts.pendingTransactions

  // Fold a polled batch's signatures into the run totals. Shared by the resume
  // guard and the in-loop confirm so both accumulate identically.
  const collect = (status: BatchStatus) => {
    const summary = summarizeBatch(status)
    // Skip signatures already counted: a resume re-polls a batch whose
    // signatures a 'pending' snapshot may already carry.
    confirmedSignatures.push(
      ...summary.confirmedSignatures.filter(
        (sig) => !confirmedSignatures.includes(sig),
      ),
    )
    failedSignatures.push(...summary.failedSignatures)
    return summary
  }

  // Only the in-flight snapshots (submitted, awaiting confirmation) carry a
  // pendingBatchId; snapshots written once a batch reaches a terminal state
  // pass nothing, clearing it so a later resume won't re-poll a settled batch.
  // Every snapshot carries the signed page until a batch read lists its
  // transactions.
  const snapshot = (
    status: MigrationSession['status'],
    pendingBatchId?: string,
    failure?: string,
    unconfirmedSubmit?: boolean,
  ): MigrationSession => ({
    originalInput,
    // Persist the batch we're currently on so a resume picks up from the last
    // unconfirmed batch instead of re-running already-confirmed work.
    nextInput: input,
    status,
    confirmedSignatures: [...confirmedSignatures],
    failedSignatures: [...failedSignatures],
    pendingBatchId,
    pendingTransactions: inFlightPage,
    pendingNextInput: pendingBatchId || inFlightPage ? inFlightNext : undefined,
    page: batch,
    failure,
    unconfirmedSubmit,
    updatedAt: now(),
  })

  // One cluster read of a signed page. Blockhash validity comes first: a
  // transaction can land only while its blockhash is in range, so a status read
  // that follows an out-of-range verdict sees every landing, apart from read
  // skew between RPC nodes (see settleSentPage).
  const readSentPage = async (
    page: PendingTransaction[],
  ): Promise<PageRow[]> => {
    const blockhashes = Array.from(new Set(page.map((tx) => tx.blockhash)))
    const valid = await Promise.all(
      blockhashes.map((blockhash) => deps.isBlockhashValid(blockhash)),
    )
    const statuses = await deps.getSignatureStatuses(
      page.map((tx) => tx.signature),
    )
    return page.map((tx, i) => {
      const status = statuses[i]
      // Never seen: not proof that it did not land until its blockhash is out
      // of range.
      if (!status) {
        return valid[blockhashes.indexOf(tx.blockhash)] ? 'pending' : 'expired'
      }
      // Seen below `confirmed`: its fork can still be dropped.
      if (
        status.confirmationStatus !== 'confirmed' &&
        status.confirmationStatus !== 'finalized'
      ) {
        return 'pending'
      }
      return status.err ? 'failed' : 'confirmed'
    })
  }

  // True when the cluster has seen any transaction of the page, or when it
  // cannot be read.
  const seen = async (page: PendingTransaction[]): Promise<boolean> => {
    try {
      const statuses = await deps.getSignatureStatuses(
        page.map((tx) => tx.signature),
      )
      return statuses.some(Boolean)
    } catch {
      return true
    }
  }

  // Settles a signed page whose submit returned no batch id, so the submit may
  // or may not have sent it. Asks the cluster for each signature:
  // - any transaction that can still land: persist the page and report pending;
  // - none landed and none can: 'unsent', the page is safe to request again;
  // - all landed: 'advance', the run continues from the saved next input;
  // - some landed and the rest cannot, or one errored on-chain: partial, failed.
  const settleSentPage = async (
    page: PendingTransaction[],
  ): Promise<RunOutcome | 'advance' | 'unsent'> => {
    deps.onProgress({ phase: 'confirming', batch })
    let rows = await withRetry(() => readSentPage(page), sleep)
    if (rows.includes('expired')) {
      // `expired` is final only when a second read agrees (see
      // EXPIRED_CONFIRM_MS): a transaction can land in its last valid block.
      const first = rows
      await sleep(EXPIRED_CONFIRM_MS)
      const second = await withRetry(() => readSentPage(page), sleep)
      rows = second.map((row, i) =>
        row === 'expired' && first[i] !== 'expired' ? 'pending' : row,
      )
    }

    if (rows.includes('pending')) {
      await deps.persist(snapshot('running'))
      return { status: 'pending', confirmedSignatures, failedSignatures }
    }

    // Every transaction is final: the page is no longer in flight.
    inFlightPage = undefined
    if (rows.every((row) => row === 'expired')) return 'unsent'

    page.forEach(({ signature }, i) => {
      if (rows[i] !== 'confirmed') failedSignatures.push(signature)
      else if (!confirmedSignatures.includes(signature)) {
        confirmedSignatures.push(signature)
      }
    })
    if (rows.includes('failed')) {
      await deps.persist(snapshot('failed'))
      return { status: 'failed', confirmedSignatures, failedSignatures }
    }
    if (rows.includes('expired')) {
      await deps.persist(snapshot('partial'))
      return { status: 'partial', confirmedSignatures, failedSignatures }
    }
    if (inFlightNext === null) {
      await deps.persist(snapshot('complete'))
      return { status: 'complete', confirmedSignatures, failedSignatures }
    }
    // The next input is always saved with the page. Without it, request the
    // page again: the server builds each page from on-chain state.
    if (inFlightNext === undefined) return 'unsent'
    input = inFlightNext
    batch += 1
    await deps.persist(snapshot('running'))
    return 'advance'
  }

  // Resume guard: a prior run left a batch submitted but unconfirmed. Poll it to
  // a terminal state FIRST. If anything is still in flight, report pending again
  // without re-requesting (a fresh requestMigrate would rebuild and double-send
  // the in-flight transfer). Once terminal, accumulate its signatures and fall
  // through to the normal request flow — the server recompute is now safe.
  const resumeBatchId = opts.pendingBatchId
  if (resumeBatchId) {
    const status = await withRetry(() => deps.pollStatus(resumeBatchId), sleep)
    const summary = collect(status)

    if (status.status === 'pending' || summary.pendingSignatures.length > 0) {
      await deps.persist(snapshot('running', resumeBatchId))
      return { status: 'pending', confirmedSignatures, failedSignatures }
    }

    if (inFlightPage && status.transactions.length === 0) {
      // The batch records none of the saved page's transactions. The page may
      // have been sent, and only the cluster can tell.
      const settled = await settleSentPage(inFlightPage)
      if (settled !== 'advance' && settled !== 'unsent') return settled
    } else {
      inFlightPage = undefined
      // The batch confirmed cleanly and its next input is known: skip its page.
      if (
        opts.pendingNextInput !== undefined &&
        status.status === 'confirmed' &&
        summary.failedSignatures.length === 0
      ) {
        if (opts.pendingNextInput === null) {
          await deps.persist(snapshot('complete'))
          return { status: 'complete', confirmedSignatures, failedSignatures }
        }
        input = opts.pendingNextInput
        batch += 1
        await deps.persist(snapshot('running'))
      }
    }
  } else if (inFlightPage) {
    // A prior run saved a signed page but no batch id. Settle it first: a
    // request before that could rebuild and double-send a landed transfer.
    const settled = await settleSentPage(inFlightPage)
    if (settled !== 'advance' && settled !== 'unsent') return settled
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Set once this page is submitted, so an error after submit keeps the
    // resume guard's batch id.
    let inFlightBatchId: string | undefined
    // Set just before this page's submit call, so an error after it may mean
    // the batch was sent.
    let submitStarted = false
    // Set when any submit attempt threw without a definite rejection: that
    // attempt may have landed even if a later attempt was rejected.
    let ambiguousAttempt = false
    try {
      deps.onProgress({ phase: 'requesting', batch })
      // Bind to a loop-local const so the retry closure captures this batch's
      // input, not the reassigned outer `input`.
      const batchInput = input
      // eslint-disable-next-line no-await-in-loop
      const out = await withRetry(() => deps.requestMigrate(batchInput), sleep)
      const data = out.transactionData

      // Never sign or submit an empty page: the server answers an empty submit
      // with a BAD_REQUEST, which reads as an unknown outcome.
      if (data.transactions.length === 0) {
        // More remain but none came: a server fault. A request for nextParams
        // (often equal to this input) would loop. An empty last page completes
        // the run only when an earlier page confirmed something; with nothing
        // moved, report the empty page.
        if (out.hasMore || confirmedSignatures.length === 0) {
          throw new Error(deps.emptyPageMessage)
        }
        // Nothing remains: the server builds each page from on-chain state.
        // eslint-disable-next-line no-await-in-loop
        await deps.persist(snapshot('complete'))
        return { status: 'complete', confirmedSignatures, failedSignatures }
      }

      deps.onProgress({
        phase: 'signing',
        batch,
        count: data.transactions.length,
      })
      // eslint-disable-next-line no-await-in-loop
      const signed = await deps.signBatch(data)

      // Save the signed page BEFORE the submit: the server can send it and
      // still throw, or the app can stop before the batch id arrives. The
      // resume then checks these signatures instead of requesting the page.
      const page = deps.describeSigned(signed)
      inFlightNext = out.hasMore && out.nextParams ? out.nextParams : null
      inFlightPage = page
      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('running'))

      deps.onProgress({ phase: 'submitting', batch })
      submitStarted = true
      let submitted: { batchId: string }
      try {
        // eslint-disable-next-line no-await-in-loop
        submitted = await withRetry(async () => {
          try {
            return await deps.submitBatch(signed, data)
          } catch (e) {
            if (!isRejection(e)) ambiguousAttempt = true
            throw e
          }
        }, sleep)
      } catch (submitErr) {
        // Every attempt was a definite rejection. The server can still have
        // sent the page in an earlier attempt of its own retry loop, so one
        // cluster read must see none of its transactions before the page is
        // dropped.
        // eslint-disable-next-line no-await-in-loop
        if (
          isRejection(submitErr) &&
          !ambiguousAttempt &&
          !(await seen(page))
        ) {
          inFlightPage = undefined
          throw submitErr
        }
        // Some attempt may have sent the page. Only the cluster can tell.
        // eslint-disable-next-line no-await-in-loop
        const settled = await settleSentPage(page)
        if (settled === 'unsent') throw submitErr
        if (settled !== 'advance') return settled
        // eslint-disable-next-line no-continue
        continue
      }
      const { batchId } = submitted
      inFlightBatchId = batchId

      // Persist a resumable snapshot BEFORE confirmation carrying this batch's id:
      // if the app is killed while the batch is still confirming, the resume
      // re-polls it instead of re-requesting an orphaned in-flight submission.
      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('running', batchId))

      deps.onProgress({ phase: 'confirming', batch })
      // eslint-disable-next-line no-await-in-loop
      const status = await withRetry(() => deps.pollStatus(batchId), sleep)
      const summary = collect(status)
      if (status.transactions.length > 0) {
        inFlightPage = undefined
      } else if (inFlightPage) {
        // The server returned a batch id that records none of this page's
        // transactions. The page may have been sent, and only the cluster can
        // tell.
        // eslint-disable-next-line no-await-in-loop
        await deps.persist(snapshot('running', batchId))
        return { status: 'pending', confirmedSignatures, failedSignatures }
      }
      // The server reports `failed` or `partial` once one transaction failed,
      // even with others still pending. Neither is final until none is.
      const unsettled =
        status.status === 'pending' || summary.pendingSignatures.length > 0

      if (
        !unsettled &&
        (status.status === 'failed' || status.status === 'expired')
      ) {
        // eslint-disable-next-line no-await-in-loop
        await deps.persist(snapshot('failed'))
        return { status: 'failed', confirmedSignatures, failedSignatures }
      }

      if (!unsettled && summary.failedSignatures.length > 0) {
        // A retry replays this batch's full input (explicit token amounts
        // included); the client can't tell which assets a confirmed signature
        // covered — transactions.get returns signature + status only. Not
        // re-sending already-confirmed transfers therefore depends on the server
        // recomputing remaining work from on-chain state. This is a documented
        // contract dependency, not something the client can guard here.
        // eslint-disable-next-line no-await-in-loop
        await deps.persist(snapshot('partial'))
        return { status: 'partial', confirmedSignatures, failedSignatures }
      }

      // Nothing terminally failed, but the batch isn't fully confirmed yet —
      // txs are still pending (a poll timed out mid-confirmation). Report this
      // as still-processing, not a partial failure. The 'running' session stays
      // resumable so the user can check back and continue idempotently.
      if (unsettled || status.status === 'partial') {
        // Carry the in-flight batch id so a "check status" re-polls it before any
        // re-request — the funds-safety guard against a double-send.
        // eslint-disable-next-line no-await-in-loop
        await deps.persist(snapshot('running', batchId))
        return { status: 'pending', confirmedSignatures, failedSignatures }
      }

      if (out.hasMore && out.nextParams) {
        // Advance to the next batch BEFORE persisting so the snapshot carries the
        // next batch's input. Persisting first would record the just-confirmed
        // batch, making a crash-resume re-request already-confirmed work.
        input = out.nextParams
        // This page's batch is settled: a failed persist below must not save it
        // as in flight, or a resume re-polls it and numbers the next page one
        // too high.
        inFlightBatchId = undefined
        batch += 1
        // eslint-disable-next-line no-await-in-loop
        await deps.persist(snapshot('running'))
        // eslint-disable-next-line no-continue
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('complete'))
      return { status: 'complete', confirmedSignatures, failedSignatures }
    } catch (err) {
      // Nothing was submitted (request or sign failed, or the save before the
      // submit threw), so no page is in flight. On page 1 nothing is saved
      // either: rethrow so the caller retries the original selection.
      if (!submitStarted) {
        inFlightPage = undefined
        if (batch === 1) throw err
      }
      // Save this page's input (the last nextParams) so the retry resumes here
      // and never re-sends the original selection. A 4xx reaches this point on
      // its first attempt; the retry is the user's single request. A signed
      // page that is still in flight here may have been sent and could not be
      // settled (the cluster read threw): the snapshot keeps it for the resume
      // guard and flags unconfirmedSubmit so the user checks Activity first.
      try {
        // eslint-disable-next-line no-await-in-loop
        await deps.persist(
          snapshot(
            'failed',
            inFlightBatchId,
            errorMessage(err),
            inFlightPage ? true : undefined,
          ),
        )
      } catch (persistErr) {
        console.warn('Failed to persist migration session', persistErr)
      }
      return { status: 'failed', confirmedSignatures, failedSignatures }
    }
  }
}
