import type { Keypair } from '@solana/web3.js'
import type { CSAccount, CSAccounts } from '../../../storage/cloudStorage'
import {
  MAIN_DERIVATION_PATHS,
  solanaWithChange,
  solanaWithoutChange,
} from '../../../utils/derivationPaths'

// The paths Import scans first, which covers the app's default path and sub-accounts 0-9
const SCANNED_DERIVATION_PATHS = [
  ...MAIN_DERIVATION_PATHS,
  ...solanaWithChange(0, 10),
  ...solanaWithoutChange(0, 10),
]

export type RestoredAccount = {
  account: CSAccount
  keypair: Keypair
  derivationPath: string
}

// A hardware wallet account signs on its device; it never gets a software key
const isSoftwareAccount = (account: CSAccount) =>
  !account.ledgerDevice && !account.keystoneDevice

// Matches the words against the listed accounts. Returns the account being
// restored first, then every other listed account the words hold a key for.
// Returns nothing when the words do not hold the key for the account being
// restored.
export const matchRestoredAccounts = async ({
  accounts,
  accountAddress,
  derive,
}: {
  accounts: CSAccounts
  accountAddress: string
  derive: (derivationPath: string) => Promise<Keypair | null>
}): Promise<RestoredAccount[]> => {
  const target = accounts[accountAddress]
  if (!target || !isSoftwareAccount(target)) return []

  const candidates = Object.values(accounts).filter(isSoftwareAccount)
  const paths = [
    ...new Set([
      ...candidates.flatMap((a) =>
        a.derivationPath ? [a.derivationPath] : [],
      ),
      ...SCANNED_DERIVATION_PATHS,
    ]),
  ]
  const derived = await Promise.all(
    paths.map(async (derivationPath) => ({
      derivationPath,
      keypair: await derive(derivationPath),
    })),
  )

  const restored = candidates.flatMap((account) => {
    const match = derived.find(
      ({ keypair }) => keypair?.publicKey.toBase58() === account.solanaAddress,
    )
    return match?.keypair
      ? [
          {
            account,
            keypair: match.keypair,
            derivationPath: match.derivationPath,
          },
        ]
      : []
  })

  const restoredTarget = restored.find((r) => r.account === target)
  if (!restoredTarget) return []
  return [restoredTarget, ...restored.filter((r) => r !== restoredTarget)]
}
