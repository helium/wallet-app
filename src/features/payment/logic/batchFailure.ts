import { BatchStatus } from '../../../hooks/useTransactionBatchStatus'
import { batchSubmitError } from './batchSubmitError'

export type TransactionStatus = { signature: string; status: BatchStatus }

// What the batch carried: each item with every transaction that touches it.
export type SentItem<T> = { item: T; signatures: string[] }

export type BatchFailure<T> =
  | { kind: 'retry'; error: Error; failed: T[] }
  | { kind: 'checkActivity'; error: Error }

export const checkActivity = <T>(): BatchFailure<T> => ({
  kind: 'checkActivity',
  error: new Error(
    'Could not confirm which transactions went through. Check your activity.',
  ),
})

// A failed batch offers Retry only for the items it knows did not land: every
// transaction touching the item failed. 'failed' is the only status the
// cluster settles as not landed; an 'expired' or 'pending' transaction can
// still land, so any doubt offers no Retry.
export const batchFailure = <T>(
  status: BatchStatus | undefined,
  transactions: TransactionStatus[],
  sent: SentItem<T>[],
): BatchFailure<T> | undefined => {
  const error = batchSubmitError(status)
  if (!error) return undefined
  if (status === 'expired') return checkActivity()

  const statusOf = new Map(transactions.map((t) => [t.signature, t.status]))
  const settled = transactions.every(
    (t) => t.status === 'confirmed' || t.status === 'failed',
  )
  const outcomes = sent.map(({ signatures }) =>
    signatures.map((s) => statusOf.get(s)),
  )
  const known = outcomes.every(
    (o) =>
      o.length > 0 &&
      (o.every((s) => s === 'confirmed') || o.every((s) => s === 'failed')),
  )
  const failed = sent
    .filter((_, i) => outcomes[i].every((s) => s === 'failed'))
    .map(({ item }) => item)
  if (!settled || !known || !failed.length) return checkActivity()

  return { kind: 'retry', error, failed }
}
