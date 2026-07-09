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

export const deriveResume = (
  s: MigrationSession | null,
): {
  canResume: boolean
  input: MigrateInput | null
  movedCount: number
  failedCount: number
} => {
  if (s && RESUMABLE.has(s.status))
    return {
      canResume: true,
      input: s.originalInput,
      movedCount: s.confirmedSignatures.length,
      failedCount: s.failedSignatures.length,
    }
  return { canResume: false, input: null, movedCount: 0, failedCount: 0 }
}
