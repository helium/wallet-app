import { rewardableEntityConfigKey } from '@helium/helium-entity-manager-sdk'
import { daoKey, subDaoKey } from '@helium/helium-sub-daos-sdk'
import { lazyDistributorKey } from '@helium/lazy-distributor-sdk'
import { HNT_MINT, IOT_MINT, MOBILE_MINT, DC_MINT } from '@helium/spl-utils'
import { NATIVE_MINT } from '@solana/spl-token'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

export const Mints: Record<string, string> = {
  SOL: NATIVE_MINT.toBase58(),
  IOT: IOT_MINT.toBase58(),
  MOBILE: MOBILE_MINT.toBase58(),
  HNT: HNT_MINT.toBase58(),
  DC: DC_MINT.toBase58(),
}

export const GovMints: string[] = [Mints.HNT, Mints.MOBILE, Mints.IOT]

export const MOBILE_LAZY_KEY = lazyDistributorKey(
  new PublicKey(Mints.MOBILE),
)[0]

export const IOT_LAZY_KEY = lazyDistributorKey(new PublicKey(Mints.IOT))[0]
export const DAO_KEY = daoKey(HNT_MINT)[0]
export const IOT_SUB_DAO_KEY = subDaoKey(IOT_MINT)[0]
export const MOBILE_SUB_DAO_KEY = subDaoKey(MOBILE_MINT)[0]
export const IOT_CONFIG_KEY = rewardableEntityConfigKey(
  IOT_SUB_DAO_KEY,
  'IOT',
)[0]
export const MOBILE_CONFIG_KEY = rewardableEntityConfigKey(
  MOBILE_SUB_DAO_KEY,
  'MOBILE',
)[0]

export const MIN_BALANCE_THRESHOLD = 0.02 * LAMPORTS_PER_SOL

// Make a smaller batch for the sake of ledger.
export const MAX_TRANSACTIONS_PER_SIGNATURE_BATCH = 5
