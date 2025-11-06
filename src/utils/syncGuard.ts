export class SyncGuard {
  private isSyncing = false

  private lastSyncKey = ''

  private lastSyncTime = 0

  private cooldownMs: number

  constructor(cooldownMs = 5000) {
    this.cooldownMs = cooldownMs
  }

  /**
   * Check if a sync operation can proceed
   * @param syncKey Unique identifier for the sync operation
   * @returns true if sync can proceed, false if blocked by existing sync or cooldown
   */
  canSync(syncKey: string): boolean {
    // Check if sync is already in progress
    if (this.isSyncing) {
      return false
    }

    // Check cooldown using timestamp
    const now = Date.now()
    if (
      this.lastSyncKey === syncKey &&
      now - this.lastSyncTime < this.cooldownMs
    ) {
      return false
    }

    return true
  }

  /**
   * Start a sync operation
   * @param syncKey Unique identifier for the sync operation
   */
  startSync(syncKey: string): void {
    this.isSyncing = true
    this.lastSyncKey = syncKey
    this.lastSyncTime = Date.now()
  }

  /**
   * End the current sync operation
   */
  endSync(): void {
    this.isSyncing = false
  }

  /**
   * Reset the sync guard state completely
   */
  reset(): void {
    this.isSyncing = false
    this.lastSyncKey = ''
    this.lastSyncTime = 0
  }

  /**
   * Get the remaining cooldown time in milliseconds
   * @param syncKey Unique identifier for the sync operation
   * @returns remaining cooldown time in ms, 0 if no cooldown
   */
  getRemainingCooldown(syncKey: string): number {
    if (this.lastSyncKey !== syncKey) {
      return 0
    }

    const now = Date.now()
    const elapsed = now - this.lastSyncTime
    const remaining = this.cooldownMs - elapsed

    return Math.max(0, remaining)
  }

  /**
   * Check if currently syncing
   */
  get isCurrentlySyncing(): boolean {
    return this.isSyncing
  }
}
