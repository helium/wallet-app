<<<<<<< HEAD
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'

import { lazyDistributorKey } from '@helium/lazy-distributor-sdk'
=======
import { lazyDistributorKey } from '@helium/lazy-distributor-sdk'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
>>>>>>> 3a3cbc7 (Add constants)
import { PublicKey } from '@solana/web3.js'

export const Mints: Record<string, string> = {
  IOT: IOT_MINT.toBase58(),
  MOBILE: MOBILE_MINT.toBase58(),
  HNT: HNT_MINT.toBase58(),
}
<<<<<<< HEAD

export const MOBILE_LAZY_KEY = lazyDistributorKey(
  new PublicKey(Mints.MOBILE),
)[0]

=======
export const MOBILE_LAZY_KEY = lazyDistributorKey(
  new PublicKey(Mints.MOBILE),
)[0]
>>>>>>> 3a3cbc7 (Add constants)
export const IOT_LAZY_KEY = lazyDistributorKey(new PublicKey(Mints.IOT))[0]
