# Maestro baseline suite

End-to-end regression flows. The flows select elements by `testID` only.

## Run

1. Install a debug or release build on an iOS simulator or Android emulator.
2. Export the fixture values:

   ```bash
   export MAESTRO_FIXTURE_SEED="word1 word2 ..."    # 12 or 24 words
   export MAESTRO_DEVNET_RECIPIENT="<devnet address>"
   export MAESTRO_PRIVY_TEST_EMAIL="<Privy test account email>"
   export MAESTRO_PRIVY_TEST_OTP="<Privy test account code>"
   ```

3. Run the suite from the repo root:

   ```bash
   maestro test .maestro
   ```

Maestro passes shell variables that start with `MAESTRO_` to the flows.

## Flows

| Flow | Network | Submits |
|---|---|---|
| 01-create-account | none | no |
| 02-import-account | mainnet | no |
| 03-balances | mainnet | no |
| 04-swap-review | mainnet | no, cancels at the sign sheet |
| 05-governance-review | mainnet | no, cancels at the sign sheet |
| 06-migration-review | mainnet | no, stops on the review screen |
| 07-send-devnet | devnet | yes |
| 08-settings | mainnet | no |

The flows run in this order. Flows 03 to 08 use the account that flow 02 imports.

## Fixture account

The fixture account needs:

- devnet SOL and devnet HNT, for flow 07
- mainnet SOL and some MOBILE, for flow 04
- one HNT position that is not delegated, for flow 05

Store the seed as the CI secret `MAESTRO_FIXTURE_SEED`. Do not commit it.

## Privy test account

Flow 06 logs in to Migrate to World by email. The flow uses a Privy test
account, which has a fixed email and a fixed one-time code. The app has no
test login of its own.

1. In the Privy dashboard of the app that the build uses, enable test accounts.
2. Store the test account email as the CI secret `MAESTRO_PRIVY_TEST_EMAIL`.
3. Store its one-time code as the CI secret `MAESTRO_PRIVY_TEST_OTP`.

The flow stops on the review screen. Confirm signs and submits the migration
at once, with no sign sheet, so the flow never taps it.
