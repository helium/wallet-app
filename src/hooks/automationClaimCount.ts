// claimCount is null when there is no cron job and undefined when it has not
// loaded. Only a known 0 needs a claim.
export const needsWalletClaim = (
  hasExistingAutomation: boolean,
  claimCount: number | null | undefined,
): boolean => hasExistingAutomation && claimCount === 0

export const shouldAddWalletClaim = (
  claimCount: number | null | undefined,
): boolean => claimCount === 0
