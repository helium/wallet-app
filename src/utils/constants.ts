import { lazyDistributorKey } from '@helium/lazy-distributor-sdk'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { PublicKey } from '@solana/web3.js'

export const Mints: Record<string, string> = {
  IOT: IOT_MINT.toBase58(),
  MOBILE: MOBILE_MINT.toBase58(),
  HNT: HNT_MINT.toBase58(),
}
export const MOBILE_LAZY_KEY = lazyDistributorKey(
  new PublicKey(Mints.MOBILE),
)[0]
export const IOT_LAZY_KEY = lazyDistributorKey(new PublicKey(Mints.IOT))[0]
