# Migrate to World — Design

**Status:** Approved design, pending implementation plan
**Date:** 2026-07-09
**Feature branch:** `feat/migrate`

## Summary

Let a Helium wallet-app user move their Hotspots and tokens from their self-custodied
Helium wallet into a **World Explorer** wallet. Two paths are offered and the user
chooses:

1. **Email (Privy)** — the guided in-app path. The user signs in with email, we create
   a Privy embedded Solana wallet for them, and the app transfers assets to it.
2. **Self-custody (connect)** — for users who want to keep their own keys or use a
   hardware wallet. We give guided, branched instructions to connect an existing
   external wallet as the World destination.

Migration is a **transfer**, never a wipe: the source wallet keeps its keys, and
anything that fails to move simply stays put and can be retried later.

This is a **re-architecture** of the prototype left on `feat/migrate` (see
[Relationship to existing code](#relationship-to-existing-code)), not an incremental
edit of it.

## Goals

- Intuitive, low-decision flow using current (2026) mobile UI patterns.
- Handle partial completion, interruption, and per-item failure as first-class states —
  not generic error screens.
- Clean, typed data access through the canonical backend contract; no raw `fetch`, no
  unsound casts.
- Correct multi-signer transaction handling (the prototype's largest defect).

## Non-goals

- No in-app hardware-wallet signing for the direct migration. Hardware-wallet users are
  routed to the self-custody connect path.
- No eligibility gating in the UI — migration is open to everyone. (Any backend
  allowlist remains a backend concern and is out of scope here.)
- No migration of unknown/unsupported token mints. Only known mints (WSOL, USDC, USDT,
  HNT, MOBILE, IOT, DC) move; anything else is surfaced and left behind.
- Not touching `SolanaMigration.tsx` (the legacy Helium→Solana migration), which is a
  separate feature that merely lives in the same directory.

## Locked decisions

| Decision           | Choice                                                            |
| ------------------ | ----------------------------------------------------------------- |
| Scope              | Re-architect from scratch                                         |
| Paths              | Offer both (email/Privy + self-custody/connect), user chooses     |
| Privy app          | Reuse the existing Privy app (`PRIVY_APP_ID` / `PRIVY_CLIENT_ID`) |
| Hardware wallets   | Software-only direct migration; route HW to the connect path      |
| Eligibility        | Open to everyone                                                  |
| Token scope        | Known mints only, warn about the rest                             |
| Entry points       | One-time announcement modal + persistent Settings entry           |
| Visual direction   | World Light (Privy purple `#7C3AED` on a light gradient)          |
| Asset selection UI | Summary cards + drill-in edit sheets, everything pre-selected     |
| Wallet creation    | Folded into migration progress (no dedicated screen)              |
| Fees               | Sponsored server-side; shown to the user as "Free" / "$0.00"      |
| Data access        | Typed oRPC via `@helium/blockchain-api` `fullApiContract` client  |
| Signing            | Per-transaction, honoring `metadata.signers`                      |
| Failure model      | Resumable + partial-retry, non-destructive                        |

## User experience

### Entry points

- **One-time announcement.** After the wallet loads, a dismissible modal introduces
  migration. It shows once per wallet address (persisted), so multi-wallet users see it
  per account and nobody is nagged repeatedly.
- **Persistent entry.** A row in Settings ("Migrate to World") is always available for
  users who dismissed the announcement or want to return.

### Email (Privy) path — the happy path

An 8-beat flow, visualized in the brainstorming filmstrip (World Light aesthetic):

1. **Intro** — what migration does, "no fees, we cover them," Continue / Not now.
2. **Email sign-in** — enter email, receive OTP.
3. **Verify OTP** — enter the code; resend available with backoff.
   _(The Privy embedded wallet is created silently here — no dedicated screen.)_
4. **Asset selection** — see [Asset selection](#asset-selection) below.
5. **Review** — summary of what will move + "Fees: Free," confirm.
6. **Migrating** — progress screen; first line item is "✓ World wallet ready," then
   per-batch progress.
7. **Partial / retry** (only if needed) — shows what moved and what needs a retry.
8. **Success** — done state, reveals the new World wallet address.

### Asset selection

**Layout:** summary-card style with drill-in (brainstorm variant C).

- Two tappable summary cards on the main screen: **Hotspots** (count) and **Tokens**
  (count + approx USD value). Everything is pre-selected — the default is "move
  everything."
- The **known-mints warning** ("N tokens can't move automatically — they stay in your
  wallet") sits on the main screen so it is never a surprise.
- **Edit ›** on each card opens a drill-in sheet:
  - _Hotspots sheet_ — list with per-item toggle to deselect specific hotspots.
  - _Tokens sheet_ — list with per-token editable amount + **MAX** (the granular control
    from brainstorm variant A), so a user can move a partial balance.
- Most users tap **Review & migrate** without ever opening a drill-in.

**Empty wallet:** if there is nothing migratable, skip asset selection and go straight to
an "all set / nothing to migrate" state.

### Self-custody (connect) path

For users keeping their own keys or using hardware wallets. Guided, **branched**
instructions to connect an existing external wallet (e.g. Phantom, Solflare) as the World
destination, following World Explorer's wallet-standard / SIWS connect model. This path
does not create a Privy wallet.

> Design note: because wallet-app users self-custody, the destination for the direct
> (email) path must be a wallet the app can sign with — hence a Privy **embedded**
> wallet. The self-custody path hands off to a wallet the user already controls. This is
> a forced consequence of self-custody, not a stylistic choice.

## Architecture

### Feature layout (`src/features/migration/`)

The flow is a **state machine** with persisted session state, plus a thin set of hooks
that isolate concerns:

- **`useMigrationSession`** — owns the state machine (intro → login → selection → review →
  migrating → partial → success), persists session state to AsyncStorage after every
  confirmed batch, and detects/offers **Resume** on reopen.
- **`useMigrationAssets`** — loads migratable assets via the typed client
  (`migration.getHotspots`, `tokens.getBalances`), classifies known vs. unknown mints,
  and produces the selection model.
- **`useMigrationExecutor`** — drives execution: requests transfer data
  (`migration.migrate`), signs each transaction according to its `metadata.signers`,
  submits (`transactions.submit`), polls to confirmation (`transactions.get`), advances
  through batches via `hasMore` / `nextParams`, and reports per-item outcomes.

Each hook is independently testable: assets loading, execution, and session/persistence
do not reach into each other's internals — they communicate through plain data
(selection model, batch results, session snapshot).

### UI components

- **Screens/steps** (World Light): `IntroStep`, `EmailLoginStep` (**shared** — see
  cleanup below), `AssetSelectionStep` + `HotspotsEditSheet` + `TokensEditSheet`,
  `ReviewStep`, `ProgressStep`, `PartialRetryStep`, `SuccessStep`.
- **Self-custody:** `ConnectStep(s)` with branched instructions.
- **Entry:** the announcement modal + the Settings row.
- **Provider:** the existing `PrivyAppProvider` wraps the flow.

### Data & signing

- **All backend access is typed oRPC** through the `@helium/blockchain-api`
  `fullApiContract` client — no raw `fetch`, and the `solBalance`/token casts (`as any`)
  are dropped in favor of the real types.
- **`migration.migrate`** returns `transactionData.transactions[]`, each with
  `serializedTransaction` and `metadata.signers`. The executor signs each transaction
  with exactly the wallets its metadata names:
  - `"source"` → the source Helium wallet (anchorProvider).
  - `"destination"` → the Privy embedded wallet.
  - Split-reward / mini-fanout hotspots require **both**; the prototype signed source-only
    and would have silently under-signed these.
- **Fees are sponsored server-side** (fee payer, ATA creation, rent, Jito tips). The user
  can migrate 100% of their SOL and pay nothing; the UI presents fees as "Free."

## Error handling & edge cases

Partial completion is a **normal** state, because migration is many transactions across
paginated batches.

1. **Resumable by construction.** After every confirmed batch, the session (source wallet,
   destination wallet, remaining `nextParams`, confirmed signatures) is persisted.
   Backgrounding, network loss, or a crash mid-migration is recoverable: on reopen the
   app detects the in-flight session and offers **Resume**, picking up from the last
   unconfirmed batch. Already-confirmed work is never re-sent.
2. **Per-batch failure isolation.** A failed transaction does not abort the whole run. The
   progress screen shows what moved and what didn't ("10 of 12 Hotspots moved · 2 need a
   retry") with **Retry failed items**, which re-requests transfer data for only the
   stragglers. Backend status `partial` maps to this UI.
3. **Named error states**, each with a specific recovery:
   - Email OTP fails/expires → resend with backoff.
   - Privy wallet creation fails → retry; if persistent, surface a support path (no
     destination = cannot proceed).
   - Network loss mid-migration → auto-pause, resume on reconnect.
   - RPC / submit failure → per-batch retry with backoff.
   - Empty wallet → short-circuit to "all set," skip selection.
   - Unknown/unsupported tokens → warning banner, left behind, migration proceeds.
4. **Non-destructive.** The source wallet keeps its keys throughout. Failed items stay
   put; the user can re-run migration for leftovers at any time.

## Relationship to existing code

The `feat/migrate` branch contains a prototype from a departed engineer. This design
**replaces** its core, keeping wiring that is already correct.

**Replaced / re-architected:**

- `MigrateToWorld.tsx` (~956 lines) — monolithic 6-step flow. Its raw `fetch` to
  `${WALLET_REST_URI}/migrate`, source-only signing, and `as any` casts are the primary
  defects this design fixes.
- `MigrateToWorldModal.tsx` — its `EmailLoginStep` duplicates the login UI from
  `MigrateToWorld.tsx`. The two are **consolidated** into one shared `EmailLoginStep`.

**Kept (already correct or acceptable):**

- `PrivyProvider.tsx` — thin `Config`-driven wrapper.
- `AppStorageProvider` per-wallet dismissal helpers
  (`migrateToWorldDismissedByWallet`, `shouldShowMigrateToWorld`, `dismissMigrateToWorld`).
- `BlockchainApiProvider` switch to `fullApiContract`.
- Settings route + row, `en.ts` strings, `.env.sample` Privy keys.

**To revisit during implementation:**

- `metro.config.js` module-dedup hack (~57 lines) — fragile; determine whether it is
  still required once Privy deps are settled, and remove or document it.
- The unrelated `TokenListItem.tsx` balance fix bundled into the branch — separate from
  this feature; leave as-is or split out.

**Explicitly untouched:** `SolanaMigration.tsx` (legacy Helium→Solana migration).

## Backend contract (reference)

Authoritative types from `@helium/blockchain-api` (`fullApiContract`):

- `migration.getHotspots`: `{ walletAddress } → { hotspots: MigratableHotspot[] }`
  (`entityKey`, `name`, `type`, `deviceType`, `asset`, `inWelcomePack`, `splitWallets`).
- `tokens.getBalances`: returns typed `solBalance: number` and known-mint balances only
  (WSOL, USDC, USDT, HNT, MOBILE, IOT, DC).
- `migration.migrate`: `MigrateInput { sourceWallet, destinationWallet, hotspots: string[],
tokens: {mint,amount}[], password? } → MigrateOutput { transactionData: { transactions:
{ serializedTransaction, metadata?: { type, description, signers: ("source"|"destination")[] } }[],
parallel, tag? }, estimatedSolFee, warnings?, hasMore?, nextParams? }`.
- `transactions.submit` / `transactions.get`: status union
  `pending | confirmed | failed | expired | partial`.
- Fees are **sponsored server-side** (`FEE_PAYER_WALLET_PATH`): ATA creation, rent, Jito
  tips are covered. Hotspots paginate via `nextParams`; tokens are sent once in batch 1.

## Testing

- **`useMigrationExecutor`** — signer routing per `metadata.signers` (source-only,
  destination-only, both); batch advancement via `hasMore`/`nextParams`; partial-failure
  isolation and retry-of-stragglers.
- **`useMigrationSession`** — persistence after each confirmed batch; resume from an
  interrupted session without re-sending confirmed work; empty-wallet short-circuit.
- **`useMigrationAssets`** — known vs. unknown mint classification; warning surfaced for
  the unknown set.
- **Error states** — OTP expiry/resend, Privy creation failure, network-loss pause/resume,
  submit/RPC retry with backoff.
- No tests that assert only mocked behavior; execution tests exercise the real
  sign→submit→poll sequencing against the typed contract shapes.
