export type SolanaStatusResponse = {
  migrationStatus: 'not_started' | 'in_progress' | 'complete'
  minimumVersions: Record<string, string>
  finalBlockHeight?: number
}
