import defaultSleep from '../../../utils/sleep'
import { summarizeBatch, BatchStatus } from './batches'
import { MigrateInput, MigrationSession } from './session'
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

export type RunOutcome = {
  status: 'complete' | 'partial' | 'failed' | 'pending'
  confirmedSignatures: string[]
  failedSignatures: string[]
  // The input for the batch that failed / went pending, so a same-session retry
  // resumes from it instead of rebuilding from the first batch.
  nextInput?: MigrateInput
}

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

export const runMigration = async <TSigned = unknown>(
  originalInput: MigrateInput,
  deps: ExecutorDeps<TSigned>,
): Promise<RunOutcome> => {
  const confirmedSignatures: string[] = []
  const failedSignatures: string[] = []
  const sleep = deps.sleep ?? defaultSleep
  let input = originalInput
  let batch = 1

  const snapshot = (status: MigrationSession['status']): MigrationSession => ({
    originalInput,
    // Persist the batch we're currently on so a resume picks up from the last
    // unconfirmed batch instead of re-running already-confirmed work.
    nextInput: input,
    status,
    confirmedSignatures: [...confirmedSignatures],
    failedSignatures: [...failedSignatures],
    updatedAt: now(),
  })

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

    // Persist a resumable snapshot BEFORE confirmation: if the app is killed
    // while the first batch is still confirming, this leaves a 'running'
    // session to resume from instead of an orphaned in-flight submission.
    // eslint-disable-next-line no-await-in-loop
    await deps.persist(snapshot('running'))

    deps.onProgress({ phase: 'confirming', batch })
    // eslint-disable-next-line no-await-in-loop
    const status = await withRetry(() => deps.pollStatus(batchId), sleep)
    const summary = summarizeBatch(status)
    confirmedSignatures.push(...summary.confirmedSignatures)
    failedSignatures.push(...summary.failedSignatures)

    if (status.status === 'failed' || status.status === 'expired') {
      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('failed'))
      return {
        status: 'failed',
        confirmedSignatures,
        failedSignatures,
        nextInput: input,
      }
    }

    if (summary.failedSignatures.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('partial'))
      return {
        status: 'partial',
        confirmedSignatures,
        failedSignatures,
        nextInput: input,
      }
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
      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('running'))
      return {
        status: 'pending',
        confirmedSignatures,
        failedSignatures,
        nextInput: input,
      }
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
