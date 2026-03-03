# Governance Modal Fixes

## Problem

Two issues in the governance UI:

1. **ClaimingRewardsModal is over-engineered.** It accepts a `Status` prop for batch progress tracking, but the refactored mutation system never provides it (`status={undefined}`). The modal shows "Preparing Transactions..." with a 0% progress bar forever. The progress tracking machinery (from the old `bulkSendTransactions` flow) is dead code.

2. **Decayed delegated positions show invalid actions.** The PositionCard action sheet shows "Change Delegation" and "Renew Delegation" for fully decayed positions. These actions can't succeed — the only valid action is "Undelegate".

## Changes

### 1. Simplify ClaimingRewardsModal

**File:** `src/features/governance/ClaimingRewardsModal.tsx`

Remove:
- `Status` import from `@helium/spl-utils`
- `ProgressBar` import and component
- `status` prop
- `useMemo` computing `helpText`/`percent` from batch status

Keep:
- Portal/blur overlay structure
- Account icon
- Title (`gov.claiming.title`)
- Body text (`gov.claiming.body`)
- Multiple-signing note (`gov.claiming.multiple`)

The modal becomes a static informational overlay telling users they may need to sign multiple transactions.

**File:** `src/features/governance/PositionsScreen.tsx`

Remove `status={undefined}` prop from `<ClaimingRewardsModal>`.

### 2. Hide delegation actions on decayed positions

**File:** `src/features/governance/PositionCard.tsx`

In the `isDelegated` branch of the actions function, gate the delegation actions:

```diff
- {canDelegate && (
+ {canDelegate && !isDecayed && (
```

This hides "Change Delegation" and "Renew Delegation" for fully decayed positions. "Undelegate" remains visible since that's the only valid action.

## What we're NOT changing

- `useGovernanceSubmit.ts` — pagination loop works correctly, no changes needed
- `useGovernanceMutations.ts` — `hasMore` detection works correctly
- Translation strings — existing keys are sufficient
