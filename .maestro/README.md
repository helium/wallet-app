# Maestro baseline suite

End-to-end regression flows. The flows select elements by `testID` only.

## Run

Flows 02 to 08 run against a local surfpool mainnet fork, not mainnet or
devnet. A local blockchain-api reads and writes the same fork. Each run seeds
a new fixture wallet, so no seed with real funds is needed.

You need `surfpool`, Docker, `curl`, and Node 24 (it runs the TypeScript seed
script directly).

1. Make a debug build that points at this machine. Android debug builds
   allow the plain-HTTP local URLs. The `env` command prints exports for
   `MAINNET_RPC_URL` and `MAINNET_HELIUM_TRANSACTION_API`. `app.config.ts`
   copies them into `extra`, and a value set in the shell wins over `.env`.
   Only a build made from this shell uses the fork. Release and EAS builds
   do not change.

   ```bash
   eval "$(scripts/maestro-surfpool.sh env)"
   yarn ios                             # or: yarn android
   ```

2. Start surfpool and blockchain-api, seed the fixture wallet, and export
   its values. The script also runs `adb reverse` for ports 8899 and 3000
   when an Android emulator is connected.

   ```bash
   export JUPITER_API_KEY="<Jupiter API key>"   # swap quotes in flow 04
   eval "$(scripts/maestro-surfpool.sh)"
   ```

   This exports `MAESTRO_FIXTURE_SEED` and `MAESTRO_RECIPIENT`.

3. Export the Privy test account values:

   ```bash
   export MAESTRO_PRIVY_TEST_EMAIL="<Privy test account email>"
   export MAESTRO_PRIVY_TEST_OTP="<Privy test account code>"
   ```

4. Run the suite from the repo root:

   ```bash
   maestro test .maestro
   ```

5. Stop surfpool and blockchain-api:

   ```bash
   scripts/maestro-surfpool.sh stop
   ```

Maestro passes shell variables that start with `MAESTRO_` to the flows.

## CI

`.github/workflows/maestro.yml` runs the suite on an Android emulator on
each pull request. It installs a pinned surfpool release, runs
`scripts/maestro-surfpool.sh` to start surfpool and blockchain-api in Docker
and seed the wallet, and builds a debug APK with the `env` exports. It needs
these repository secrets, none of which holds funds:

- `DOT_ENV`: the app `.env` file, as EAS builds use it
- `JUPITER_API_KEY`: swap quotes in flow 04
- `ASSET_ENDPOINT`: a mainnet DAS RPC, for asset reads that surfpool does
  not serve
- `MAESTRO_PRIVY_TEST_EMAIL` and `MAESTRO_PRIVY_TEST_OTP`: flow 06

## Flows

| Flow | Network | Submits |
|---|---|---|
| 01-create-account | none | no |
| 02-import-account | surfpool | no |
| 03-balances | surfpool | no |
| 04-swap-review | surfpool | no, cancels at the sign sheet |
| 05-governance-review | surfpool | no, cancels at the sign sheet |
| 06-migration-review | surfpool | no, stops on the review screen |
| 07-send | surfpool | yes, to the fork |
| 08-settings | surfpool | no |

The flows run in this order. Flows 03 to 08 use the account that flow 02 imports.

## Fixture account

`scripts/maestro-seed.ts` makes a new 24-word wallet on each run. It sets,
with surfpool cheatcodes and the local blockchain-api:

- 10 SOL
- 100 HNT, for flow 07 (10 of it goes into the position)
- 10000 MOBILE, for flow 04
- 100000 DC
- one HNT position that is not delegated, for flow 05

The script reads each balance and the position back, and fails if one is
missing. The seed lives only for the run. Do not store it as a secret.

`.maestro/surfpool/docker-compose.yml` runs blockchain-api with Postgres.
Set `ASSET_ENDPOINT` to a mainnet DAS RPC if a flow needs asset reads that
surfpool does not serve.

## Privy test account

Flow 06 logs in to Migrate to World by email. The flow uses a Privy test
account, which has a fixed email and a fixed one-time code. The app has no
test login of its own.

1. In the Privy dashboard of the app that the build uses, enable test accounts.
2. Store the test account email as the CI secret `MAESTRO_PRIVY_TEST_EMAIL`.
3. Store its one-time code as the CI secret `MAESTRO_PRIVY_TEST_OTP`.

The flow stops on the review screen. Confirm signs and submits the migration
at once, with no sign sheet, so the flow never taps it.
