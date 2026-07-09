import { summarizeBatch, BatchStatus } from './batches'
import { MigrateInput, MigrationSession } from './session'
import { signersOrDefault } from './signers'
import { SignerRole } from './types'

export type MigrateOutput = {
  transactionData: {
    transactions: {
      serializedTransaction: string
      metadata?: { signers?: SignerRole[] } & Record<string, unknown>
    }[]
    parallel: boolean
    tag?: string
  }
  hasMore?: boolean
  nextParams?: MigrateInput
  warnings?: string[]
}

// One serialized transaction as returned by the migrate API.
export type MigrationTransaction =
  MigrateOutput['transactionData']['transactions'][number]

export type ExecutorProgress =
  | { phase: 'requesting'; batch: number }
  | { phase: 'signing'; batch: number; count: number }
  | { phase: 'submitting'; batch: number }
  | { phase: 'confirming'; batch: number }

export type ExecutorDeps = {
  requestMigrate: (input: MigrateInput) => Promise<MigrateOutput>
  signBatch: (
    items: { tx: MigrationTransaction; signers: SignerRole[] }[],
    data: MigrateOutput['transactionData'],
  ) => Promise<unknown[]>
  submitBatch: (
    signed: unknown[],
    data: MigrateOutput['transactionData'],
  ) => Promise<{ batchId: string }>
  pollStatus: (batchId: string) => Promise<BatchStatus>
  persist: (session: MigrationSession) => Promise<void>
  onProgress: (progress: ExecutorProgress) => void
  // Resolves once the device is online. Awaited before each batch is
  // requested and before it is submitted so a network drop auto-pauses the
  // run instead of surfacing a transient RPC failure.
  waitForOnline?: () => Promise<void>
  // Injectable so retry backoff is instant in tests.
  sleep?: (ms: number) => Promise<void>
}

export type RunOutcome = {
  status: 'complete' | 'partial' | 'failed' | 'pending'
  confirmedSignatures: string[]
  failedSignatures: string[]
  pendingSignatures?: string[]
  failedBatch?: number
  reason?: 'failed' | 'expired'
}

const now = (): number => Date.now()

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms))

// Retry a transient async op with exponential backoff. Used for the RPC-facing
// migrate/submit calls so a flaky network doesn't abort an otherwise-fine run.
const withRetry = async <T>(
  fn: () => Promise<T>,
  sleep: (ms: number) => Promise<void>,
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

export const runMigration = async (
  originalInput: MigrateInput,
  deps: ExecutorDeps,
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
    batch,
    status,
    confirmedSignatures: [...confirmedSignatures],
    failedSignatures: [...failedSignatures],
    updatedAt: now(),
  })

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    if (deps.waitForOnline) await deps.waitForOnline()
    deps.onProgress({ phase: 'requesting', batch })
    // Bind to a loop-local const so the retry closure captures this batch's
    // input, not the reassigned outer `input`.
    const batchInput = input
    // eslint-disable-next-line no-await-in-loop
    const out = await withRetry(() => deps.requestMigrate(batchInput), sleep)
    const data = out.transactionData
    const items = data.transactions.map((t) => ({
      tx: t,
      signers: signersOrDefault(t.metadata),
    }))

    deps.onProgress({ phase: 'signing', batch, count: items.length })
    // eslint-disable-next-line no-await-in-loop
    const signed = await deps.signBatch(items, data)

    deps.onProgress({ phase: 'submitting', batch })
    // eslint-disable-next-line no-await-in-loop
    if (deps.waitForOnline) await deps.waitForOnline()
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
    const status = await deps.pollStatus(batchId)
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
        failedBatch: batch,
        reason: status.status,
      }
    }

    if (summary.failedSignatures.length > 0) {
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
      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('running'))
      return {
        status: 'pending',
        confirmedSignatures,
        failedSignatures,
        pendingSignatures: summary.pendingSignatures,
      }
    }

    if (out.hasMore && out.nextParams) {
      // eslint-disable-next-line no-await-in-loop
      await deps.persist(snapshot('running'))
      input = out.nextParams
      batch += 1
      // eslint-disable-next-line no-continue
      continue
    }

    // eslint-disable-next-line no-await-in-loop
    await deps.persist(snapshot('complete'))
    return { status: 'complete', confirmedSignatures, failedSignatures }
  }
}
