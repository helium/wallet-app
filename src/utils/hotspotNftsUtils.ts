import * as client from '@helium/distributor-oracle'
import { LazyDistributor } from '@helium/idls/lib/types/lazy_distributor'
import { init, lazyDistributorKey } from '@helium/lazy-distributor-sdk'
import { HNT_MINT, IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import { Program, setProvider } from '@coral-xyz/anchor'
import { getMint } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { useState } from 'react'
import { JsonMetadata, Metadata, Metaplex } from '@metaplex-foundation/js'
import { useAsync } from 'react-async-hook'
import { Recipient } from '../hooks/useRecipient'
import { useAccountStorage } from '../storage/AccountStorageProvider'

export const Mints: Record<string, string> = {
  IOT: IOT_MINT.toBase58(),
  MOBILE: MOBILE_MINT.toBase58(),
  HNT: HNT_MINT.toBase58(),
}

export const MOBILE_LAZY_KEY = lazyDistributorKey(
  new PublicKey(Mints.MOBILE),
)[0]
export const IOT_LAZY_KEY = lazyDistributorKey(new PublicKey(Mints.IOT))[0]

export function useProgram() {
  const [program, setProgram] = useState<Program<LazyDistributor> | null>(null)
  const { anchorProvider } = useAccountStorage()
  useAsync(async () => {
    if (!anchorProvider) return
    setProvider(anchorProvider)

    const p = await init(anchorProvider)
    setProgram((prog) => prog || (p as unknown as Program<LazyDistributor>))
  }, [anchorProvider])

  return program
}

export async function getPendingRewards(
  program: Program<LazyDistributor>,
  mint: PublicKey,
  maybeRecipient: Recipient | undefined,
  lazyKey: PublicKey = MOBILE_LAZY_KEY,
) {
  const lazyDistributor = await program.account.lazyDistributorV0.fetch(lazyKey)

  const oracleRewards = await client.getCurrentRewards(
    // TODO: Fix program type once HPL is upgraded to anchor v0.26
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    program as any,
    lazyKey,
    mint,
  )

  const rewardsMintAcc = await getMint(
    program.provider.connection,
    lazyDistributor.rewardsMint,
  )

  const sortedOracleRewards = oracleRewards
    .map((rew) => rew.currentRewards)
    .sort((a, b) => new BN(a).sub(new BN(b)).toNumber())

  const oracleMedian = new BN(
    sortedOracleRewards[Math.floor(sortedOracleRewards.length / 2)],
  )

  const subbed = oracleMedian.sub(maybeRecipient?.totalRewards || new BN(0))

  console.log(oracleMedian.toNumber())
  return {
    pendingRewards: Math.max(toNumber(subbed, rewardsMintAcc.decimals), 0),
    rewardsMint: lazyDistributor.rewardsMint,
  }
}

/**
 * Returns the account's collectables
 * @param pubKey public key of the account
 * @param metaplex metaplex connection
 * @returns hotspot collectables
 */
export const getHotspotCollectables = async (
  pubKey: PublicKey,
  metaplex: Metaplex,
) => {
  const collectables = (await metaplex
    .nfts()
    .findAllByOwner({ owner: pubKey })) as Metadata<JsonMetadata<string>>[]

  return collectables.filter((c) => c.symbol === 'HOTSPOT')
}

export const removeDashAndCapitalize = (str: string) => {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
}
