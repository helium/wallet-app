import * as client from '@helium/distributor-oracle'
import { init } from '@helium/lazy-distributor-sdk'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useSolana } from '../solana/SolanaProvider'
import { IOT_LAZY_KEY, MOBILE_LAZY_KEY } from '../utils/constants'
import * as Logger from '../utils/logger'

export function useHotspot(mint: PublicKey): {
  iotRewardsError: Error | undefined
  mobileRewardsError: Error | undefined
  createClaimIotTx: () => Promise<VersionedTransaction | undefined>
  createClaimMobileTx: () => Promise<VersionedTransaction | undefined>
  iotRewardsLoading: boolean
  mobileRewardsLoading: boolean
} {
  const { anchorProvider: provider } = useSolana()

  const [error, setError] = useState<string | null>(null)

  const {
    error: mobileRewardsError,
    execute: createClaimMobileTx,
    loading: mobileRewardsLoading,
  } = useAsyncCallback(async () => {
    if (!provider) return
    const program = await init(provider)
    const { connection } = provider

    if (mint && provider) {
      const rewards = await client.getCurrentRewards(
        // TODO: Fix program type once HPL is upgraded to anchor v0.26
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program,
        MOBILE_LAZY_KEY,
        mint,
      )

      const tx = await client.formTransaction({
        // TODO: Fix program type once HPL is upgraded to anchor v0.26
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program,
        provider,
        rewards,
        hotspot: mint,
        lazyDistributor: MOBILE_LAZY_KEY,
        assetEndpoint: connection.rpcEndpoint,
      })

      return tx
    }
  })

  const {
    error: iotRewardsError,
    execute: createClaimIotTx,
    loading: iotRewardsLoading,
  } = useAsyncCallback(async () => {
    if (!provider) return
    const program = await init(provider)
    const { connection } = provider

    if (mint && program && provider) {
      const rewards = await client.getCurrentRewards(
        // TODO: Fix program type once HPL is upgraded to anchor v0.26
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program,
        IOT_LAZY_KEY,
        mint,
      )

      const tx = await client.formTransaction({
        // TODO: Fix program type once HPL is upgraded to anchor v0.26
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program,
        provider,
        rewards,
        hotspot: mint,
        lazyDistributor: IOT_LAZY_KEY,
        assetEndpoint: connection.rpcEndpoint,
      })

      return tx
    }
  })

  useEffect(() => {
    if (mobileRewardsError) {
      Logger.error(mobileRewardsError)
      setError(mobileRewardsError.message)
    }
  }, [error, mobileRewardsError])

  return {
    createClaimMobileTx,
    createClaimIotTx,
    mobileRewardsLoading,
    iotRewardsLoading,
    iotRewardsError,
    mobileRewardsError,
  }
}
