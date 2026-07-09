export type MigrateInput = {
  sourceWallet: string
  destinationWallet: string
  hotspots: string[]
  tokens: { mint: string; amount: string }[]
  password?: string
}

export type MigrationStatus =
  | 'idle'
  | 'running'
  | 'partial'
  | 'failed'
  | 'complete'

export type MigrationSession = {
  originalInput: MigrateInput
  // The input for the last unconfirmed batch (originalInput's nextParams as the
  // run paginates). Resume picks up from here so confirmed work is never re-sent.
  nextInput?: MigrateInput
  batch?: number
  status: MigrationStatus
  confirmedSignatures: string[]
  failedSignatures: string[]
  updatedAt: number
}

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
}

export const deriveResume = (s: MigrationSession | null): ResumeInfo => {
  if (s && RESUMABLE.has(s.status))
    return {
      canResume: true,
      input: s.nextInput ?? s.originalInput,
      movedCount: s.confirmedSignatures.length,
      failedCount: s.failedSignatures.length,
    }
  return { canResume: false, input: null, movedCount: 0, failedCount: 0 }
}
