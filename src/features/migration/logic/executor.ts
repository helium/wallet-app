import defaultSleep from '../../../utils/sleep'
import { summarizeBatch, BatchStatus } from './batches'
import {
  MigrateInput,
  MigrationSession,
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

export type ExecutorDeps<TSigned = unknown> = {
  requestMigrate: (input: MigrateInput) => Promise<MigrateOutput>
  signBatch: (data: TransactionData) => Promise<TSigned[]>
  submitBatch: (
    signed: TSigned[],
    data: TransactionData,
  ) => Promise<{ batchId: string }>
  pollStatus: (batchId: string) => Promise<BatchStatus>
  persist: (session: MigrationSession) => Promise<void>
  onProgress: (progress: ExecutorProgress) => void
  // Injectable so retry backoff is instant in tests.
  sleep?: (ms: number) => Promise<void>
}

// Wrap every network-facing dep so it awaits connectivity first. A network drop
// then auto-pauses the whole run (request/submit/poll) instead of surfacing a
// transient RPC failure — gating lives in one place, not hand-picked awaits.
export const gateOnDeps = <TSigned>(
  deps: ExecutorDeps<TSigned>,
  waitForOnline: () => Promise<void>,
): ExecutorDeps<TSigned> => ({
  ...deps,
  requestMigrate: async (input) => {
    await waitForOnline()
    return deps.requestMigrate(input)
  },
  submitBatch: async (signed, data) => {
    await waitForOnline()
    return deps.submitBatch(signed, data)
  },
  pollStatus: async (batchId) => {
    await waitForOnline()
    return deps.pollStatus(batchId)
  },
})

export type RunOutcome = { status: RunStatus } & SignatureTally

const now = (): number => Date.now()

// Retry a transient async op with exponential backoff. Used for the RPC-facing
// migrate/submit calls so a flaky network doesn't abort an otherwise-fine run.
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
      if (attempt < attempts - 1) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(baseDelayMs * 2 ** attempt)
      }
    }
  }
  throw lastError
}

export type RunOptions = {
  // Set when resuming a session whose last batch went 'pending' (submitted but
  // unconfirmed). The run re-polls this batch to terminal before re-requesting
  // so an in-flight token transfer can't be rebuilt and double-sent.
  pendingBatchId?: string
}

export const runMigration = async <TSigned = unknown>(
  originalInput: MigrateInput,
  deps: ExecutorDeps<TSigned>,
  opts: RunOptions = {},
): Promise<RunOutcome> => {
  const confirmedSignatures: string[] = []
  const failedSignatures: string[] = []
  const sleep = deps.sleep ?? defaultSleep
  let input = originalInput
  let batch = 1

  // Fold a polled batch's signatures into the run totals. Shared by the resume
  // guard and the in-loop confirm so both accumulate identically.
  const collect = (status: BatchStatus) => {
    const summary = summarizeBatch(status)
    confirmedSignatures.push(...summary.confirmedSignatures)
    failedSignatures.push(...summary.failedSignatures)
    return summary
  }

  // Only the in-flight snapshots (submitted, awaiting confirmation) carry a
  // pendingBatchId; snapshots written once a batch reaches a terminal state
  // pass nothing, clearing it so a later resume won't re-poll a settled batch.
  const snapshot = (
    status: MigrationSession['status'],
    pendingBatchId?: string,
  ): MigrationSession => ({
    originalInput,
    // Persist the batch we're currently on so a resume picks up from the last
    // unconfirmed batch instead of re-running already-confirmed work.
    nextInput: input,
    status,
    confirmedSignatures: [...confirmedSignatures],
    failedSignatures: [...failedSignatures],
    pendingBatchId,
    updatedAt: now(),
  })

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
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    deps.onProgress({ phase: 'requesting', batch })
    // Bind to a loop-local const so the retry closure captures this batch's
    // input, not the reassigned outer `input`.
    const batchInput = input
    // eslint-disable-next-line no-await-in-loop
    const out = await withRetry(() => deps.requestMigrate(batchInput), sleep)
    const data = out.transactionData

    deps.onProgress({
      phase: 'signing',
      batch,
      count: data.transactions.length,
    })
    // eslint-disable-next-line no-await-in-loop
    const signed = await deps.signBatch(data)

    deps.onProgress({ phase: 'submitting', batch })
    // eslint-disable-next-line no-await-in-loop
    const { batchId } = await withRetry(
      () => deps.submitBatch(signed, data),
      sleep,
    )

    // Persist a resumable snapshot BEFORE confirmation carrying this batch's id:
    // if the app is killed while the batch is still confirming, the resume
    // re-polls it instead of re-requesting an orphaned in-flight submission.
    // eslint-disable-next-line no-await-in-loop
    await deps.persist(snapshot('running', batchId))

    deps.onProgress({ phase: 'confirming', batch })
    // eslint-disable-next-line no-await-in-loop
    const status = await withRetry(() => deps.pollStatus(batchId), sleep)
    const summary = collect(status)

    if (status.status === 'failed' || status.status === 'expired') {
      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('failed'))
      return { status: 'failed', confirmedSignatures, failedSignatures }
    }

    if (summary.failedSignatures.length > 0) {
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
    if (
      status.status === 'pending' ||
      status.status === 'partial' ||
      summary.pendingSignatures.length > 0
    ) {
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
      batch += 1
      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('running'))
      // eslint-disable-next-line no-continue
      continue
    }

    // eslint-disable-next-line no-await-in-loop
    await deps.persist(snapshot('complete'))
    return { status: 'complete', confirmedSignatures, failedSignatures }
  }
}
