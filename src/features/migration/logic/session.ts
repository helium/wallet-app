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
  status: MigrationStatus
  // Forwarded to the executor so a resumed run re-polls the in-flight batch
  // before re-requesting (see MigrationSession.pendingBatchId).
  pendingBatchId?: string
}

export const deriveResume = (s: MigrationSession | null): ResumeInfo => {
  if (s && RESUMABLE.has(s.status))
    return {
      canResume: true,
      input: s.nextInput ?? s.originalInput,
      movedCount: s.confirmedSignatures.length,
      failedCount: s.failedSignatures.length,
      status: s.status,
      pendingBatchId: s.pendingBatchId,
    }
  return {
    canResume: false,
    input: null,
    movedCount: 0,
    failedCount: 0,
    status: 'idle',
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
