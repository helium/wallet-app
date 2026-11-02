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
   `EXPO_PUBLIC_MAINNET_RPC_URL` and `EXPO_PUBLIC_MAINNET_HELIUM_TRANSACTION_API`.
   A debug bundle reads the `.env` files over the shell, and reads
   `.env.development.local` last, so write the values there. Release and EAS
   builds do not read that file. This command overwrites any
   `.env.development.local` you have. Delete the file after the run. Start
   Metro with a clean cache. Then build in a second terminal and reuse that
   Metro.

   ```bash
   scripts/maestro-surfpool.sh env | sed 's/^export //' > .env.development.local
   yarn start --reset-cache
   ```

   In a second terminal:

   ```bash
   yarn ios --no-packager               # or: yarn android --no-packager
   ```

2. Start surfpool and blockchain-api, seed the fixture wallet, and export
   its values. The script also runs `adb reverse` for ports 8899, 8900 and
   3000 when an Android emulator is connected.

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
   rm .env.development.local
   ```

Maestro passes shell variables that start with `MAESTRO_` to the flows.

## CI

`.github/workflows/maestro.yml` runs the suite on an Android emulator on
each pull request from this repository and on manual runs. Fork pull
requests get no secrets, so the job skips them. It installs a pinned surfpool release, runs
`scripts/maestro-surfpool.sh` to start surfpool and blockchain-api in Docker
and seed the wallet. It writes the fork URLs to `.env.development.local` and
exports them to every later step. It writes a stub `google-services.json` and
builds a debug APK. On a failed or cancelled run, it uploads only the surfpool
and Metro logs. It does not upload the Maestro output, because that output
holds the `MAESTRO_*` values in plaintext. It needs these repository secrets,
none of which may hold funds:

- `DOT_ENV`: the app `.env` file, as EAS builds use it
- `JUPITER_API_KEY`: swap quotes in flow 04
- `ASSET_ENDPOINT`: a mainnet DAS RPC, for asset reads that surfpool does
  not serve
- `MAESTRO_PRIVY_TEST_EMAIL` and `MAESTRO_PRIVY_TEST_OTP`: flow 06

## Flows

| Flow                 | Network  | Submits                        |
| -------------------- | -------- | ------------------------------ |
| 01-create-account    | none     | no                             |
| 02-import-account    | surfpool | no                             |
| 03-balances          | surfpool | no                             |
| 04-swap-review       | surfpool | no, cancels at the sign sheet  |
| 05-governance-review | surfpool | no, cancels at the sign sheet  |
| 06-migration-review  | surfpool | no, stops on the review screen |
| 07-send              | surfpool | yes, to the fork               |
| 08-settings          | surfpool | no                             |

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

## App Store screenshots

`scripts/app-store-screenshots.sh` captures every screenshot set that App
Store Connect needs. Each device gets a new simulator (the two iPhone Duo sets
share one). The script imports the fixture wallet with flow 02, opens each
screen with a flow in `.maestro/screenshots/`, and captures it with
`xcrun simctl io`. The wallet holds only the throwaway fixture seed, so no
real keys or funds show.

| Set                          | Simulator             | Size      |
| ---------------------------- | --------------------- | --------- |
| iphone-dynamic-island-medium | iPhone 17             | 1206x2622 |
| iphone-dynamic-island-large  | iPhone 17 Pro Max     | 1320x2868 |
| ipad-13                      | iPad Pro 13-inch (M5) | 2064x2752 |
| iphone-duo-outer (display 1) | iPhone Duo, folded    | 1398x2034 |
| iphone-duo-inner (display 3) | iPhone Duo, unfolded  | 2007x2853 |

The script fails when a file does not have the size in the table. It sets
the status bar to 9:41 with full signal and battery, light appearance, and
the en_US locale. It removes the alpha channel, which Apple rejects.

You need Xcode with the iOS 27.1 simulator runtime (the iPhone Duo does not
run on an earlier one). Set `SCREENSHOT_RUNTIME` to use another runtime.

1. Make a Release simulator build that points at the fork. A Release bundle
   does not read `.env.development.local`, so write the values to
   `.env.production.local`:

   ```bash
   scripts/maestro-surfpool.sh env | sed 's/^export //' > .env.production.local
   yarn ios --configuration Release
   ```

2. Start surfpool and seed the fixture wallet:

   ```bash
   eval "$(scripts/maestro-surfpool.sh)"
   ```

3. Run the script in a terminal, with the path to the `.app` that step 1
   built. The files go to `build/app-store-screenshots/<set>/`:

   ```bash
   scripts/app-store-screenshots.sh "<path to Helium Wallet.app>"
   ```

4. The iPhone Duo boots folded, and `simctl` has no command to unfold it.
   After the outer set, the script stops. Unfold the simulator, then press
   Enter to capture the inner set.

5. Stop surfpool and remove `.env.production.local`.
