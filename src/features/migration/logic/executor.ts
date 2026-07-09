import { summarizeBatch, BatchStatus } from './batches'
import { MigrateInput, MigrationSession } from './session'
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

export type ExecutorProgress =
  | { phase: 'requesting'; batch: number }
  | { phase: 'signing'; batch: number; count: number }
  | { phase: 'submitting'; batch: number }
  | { phase: 'confirming'; batch: number }

export type ExecutorDeps = {
  requestMigrate: (input: MigrateInput) => Promise<MigrateOutput>
  signBatch: (
    items: { tx: unknown; signers: SignerRole[] }[],
    data: MigrateOutput['transactionData'],
  ) => Promise<unknown[]>
  submitBatch: (
    signed: unknown[],
    data: MigrateOutput['transactionData'],
  ) => Promise<{ batchId: string }>
  pollStatus: (batchId: string) => Promise<BatchStatus>
  persist: (session: MigrationSession) => Promise<void>
  onProgress: (progress: ExecutorProgress) => void
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

export const runMigration = async (
  originalInput: MigrateInput,
  deps: ExecutorDeps,
): Promise<RunOutcome> => {
  const confirmedSignatures: string[] = []
  const failedSignatures: string[] = []
  let input = originalInput
  let batch = 1

  const snapshot = (status: MigrationSession['status']): MigrationSession => ({
    originalInput,
    status,
    confirmedSignatures: [...confirmedSignatures],
    failedSignatures: [...failedSignatures],
    updatedAt: now(),
  })

  // eslint-disable-next-line no-constant-condition
  while (true) {
    deps.onProgress({ phase: 'requesting', batch })
    // eslint-disable-next-line no-await-in-loop
    const out = await deps.requestMigrate(input)
    const data = out.transactionData
    const items = data.transactions.map((t) => ({
      tx: t,
      signers: t.metadata?.signers?.length
        ? t.metadata.signers
        : (['source'] as SignerRole[]),
    }))

    deps.onProgress({ phase: 'signing', batch, count: items.length })
    // eslint-disable-next-line no-await-in-loop
    const signed = await deps.signBatch(items, data)

    deps.onProgress({ phase: 'submitting', batch })
    // eslint-disable-next-line no-await-in-loop
    const { batchId } = await deps.submitBatch(signed, data)

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
