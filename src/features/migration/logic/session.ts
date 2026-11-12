import type { MigrateInput } from '@helium/blockchain-api'

// The migrate request/resume payload is the API's own input type — kept in sync
// with the deployed schema instead of re-declared here.
export type { MigrateInput }

export type MigrationStatus =
  | 'idle'
  | 'running'
  | 'partial'
  | 'failed'
  | 'complete'

export type RunStatus = 'complete' | 'partial' | 'failed' | 'pending'

export type SignatureTally = {
  confirmedSignatures: string[]
  failedSignatures: string[]
}

// A signed transaction of a submitted page: its signature (the transaction
// id) and the blockhash that bounds how long it can still land.
export type PendingTransaction = { signature: string; blockhash: string }

export type MigrationSession = {
  originalInput: MigrateInput
  // The input for the last unconfirmed batch (originalInput's nextParams as the
  // run paginates). Resume picks up from here so confirmed work is never re-sent.
  nextInput?: MigrateInput
  status: MigrationStatus
  // The id of the batch that was submitted but not yet confirmed (a 'pending'
  // outcome). A resume must re-poll THIS batch to a terminal state before asking
  // the server to recompute remaining transfers — otherwise a still-in-flight
  // token transfer gets rebuilt and double-sent. Cleared once a batch confirms.
  pendingBatchId?: string
  // The signed page, saved before its submit and until the server returns a
  // batch id. A submit can send the page and still throw, so a resume must
  // check THESE signatures on the cluster before it requests the page again.
  pendingTransactions?: PendingTransaction[]
  // Set only with pendingBatchId or pendingTransactions: the input after the
  // in-flight page, null when that page is the last one, absent when unknown
  // (older sessions).
  pendingNextInput?: MigrateInput | null
  // The 1-based page that nextInput requests. Absent on sessions saved before
  // pages were tracked, which read as page 1.
  page?: number
  // The error message when a request, sign, submit or poll threw on `page`.
  // Cleared by the next snapshot that does not fail.
  failure?: string
  // Set with failure when a submit may have sent the page and the cluster
  // could not be read: pendingTransactions keeps the page, and the user checks
  // Activity before a retry.
  unconfirmedSubmit?: boolean
  updatedAt: number
} & SignatureTally

const RESUMABLE: ReadonlySet<MigrationStatus> = new Set([
  'running',
  'partial',
  'failed',
])

export const serializeSession = (s: MigrationSession): string =>
  JSON.stringify(s)

export const deserializeSession = (
  raw: string | null,
): MigrationSession | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (
      !parsed?.originalInput?.sourceWallet ||
      !parsed?.originalInput?.destinationWallet ||
      typeof parsed.status !== 'string'
    ) {
      return null
    }
    return parsed as MigrationSession
  } catch {
    return null
  }
}

export type ResumeInfo = {
  canResume: boolean
  input: MigrateInput | null
  movedCount: number
  failedCount: number
  // Seeds a resumed run so its snapshots keep what already moved.
  confirmedSignatures: string[]
  status: MigrationStatus
  page: number
  failure?: string
  // See MigrationSession.unconfirmedSubmit.
  unconfirmedSubmit?: boolean
  // Forwarded to the executor so a resumed run re-polls the in-flight batch
  // before re-requesting (see MigrationSession.pendingBatchId).
  pendingBatchId?: string
  // See MigrationSession.pendingTransactions.
  pendingTransactions?: PendingTransaction[]
  // See MigrationSession.pendingNextInput.
  pendingNextInput?: MigrateInput | null
}

export const deriveResume = (s: MigrationSession | null): ResumeInfo => {
  if (s && RESUMABLE.has(s.status))
    return {
      canResume: true,
      input: s.nextInput ?? s.originalInput,
      movedCount: s.confirmedSignatures.length,
      failedCount: s.failedSignatures.length,
      confirmedSignatures: s.confirmedSignatures,
      status: s.status,
      page: s.page ?? 1,
      failure: s.failure,
      unconfirmedSubmit: s.unconfirmedSubmit,
      pendingBatchId: s.pendingBatchId,
      pendingTransactions: s.pendingTransactions,
      pendingNextInput: s.pendingNextInput,
    }
  return {
    canResume: false,
    input: null,
    movedCount: 0,
    failedCount: 0,
    confirmedSignatures: [],
    status: 'idle',
    page: 1,
    pendingBatchId: undefined,
  }
}

export type OutcomeScreen = 'success' | 'pending' | 'partial'

// Single source of truth for the run-outcome/session-status → screen mapping,
// shared by the live run and the resume path so they can't drift. A batch-level
// 'failed' (zero failed signatures) still routes to the retry screen, not the
// reassuring "still processing" one.
export const stepForOutcome = (
  status: MigrationStatus | RunStatus,
): OutcomeScreen => {
  switch (status) {
    case 'complete':
      return 'success'
    case 'partial':
    case 'failed':
      return 'partial'
    default:
      // running | pending | idle — nothing terminally failed, still confirming.
      return 'pending'
  }
}
