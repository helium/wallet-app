import * as client from '@helium/distributor-oracle'
import { LazyDistributor } from '@helium/idls/lib/types/lazy_distributor'
import { IDL } from '@helium/idls/lib/esm/lazy_distributor'
import {
  init,
  lazyDistributorKey,
  PROGRAM_ID,
} from '@helium/lazy-distributor-sdk'
import { toNumber, MOBILE_MINT } from '@helium/spl-utils'
import { Program, setProvider } from '@project-serum/anchor'
import { getMint } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { useState } from 'react'
import { JsonMetadata, Metadata, Metaplex } from '@metaplex-foundation/js'
import { useAsync } from 'react-async-hook'
import { Recipient } from '../hooks/useRecipient'
import { useAccountStorage } from '../storage/AccountStorageProvider'

export const LAZY_KEY = lazyDistributorKey(new PublicKey(MOBILE_MINT))[0]

export function useProgram() {
  const [program, setProgram] = useState<Program<LazyDistributor> | null>(null)
  const { anchorProvider } = useAccountStorage()
  useAsync(async () => {
    if (!anchorProvider) return
    setProvider(anchorProvider)

    const p = await init(anchorProvider, PROGRAM_ID, IDL)
    setProgram((prog) => prog || (p as unknown as Program<LazyDistributor>))
  }, [anchorProvider])

  return program
}

export async function getPendingRewards(
  program: Program<LazyDistributor>,
  mint: PublicKey,
  maybeRecipient: Recipient | undefined,
) {
  const lazyDistributor = await program.account.lazyDistributorV0.fetch(
    LAZY_KEY,
  )

  const oracleRewards = await client.getCurrentRewards(
    // TODO: Fix program type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    program as any,
    LAZY_KEY,
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
