import * as client from '@helium/distributor-oracle'
import { PublicKey, Transaction } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { IOT_LAZY_KEY, MOBILE_LAZY_KEY } from '../utils/constants'
import { useProgram } from '../utils/hotspotNftsUtils'
import * as Logger from '../utils/logger'

export function useHotspot(mint: PublicKey): {
  iotRewardsError: Error | undefined
  mobileRewardsError: Error | undefined
  createClaimIotTx: () => Promise<Transaction | undefined>
  createClaimMobileTx: () => Promise<Transaction | undefined>
  iotRewardsLoading: boolean
  mobileRewardsLoading: boolean
} {
  const { anchorProvider } = useAccountStorage()

  const program = useProgram()
  const [error, setError] = useState<string | null>(null)

  const {
    error: mobileRewardsError,
    execute: createClaimMobileTx,
    loading: mobileRewardsLoading,
  } = useAsyncCallback(async () => {
    if (!anchorProvider) return

    const { connection } = anchorProvider
    if (mint && program && anchorProvider) {
      const rewards = await client.getCurrentRewards(
        // TODO: Fix program type once HPL is upgraded to anchor v0.26
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program as any,
        MOBILE_LAZY_KEY,
        mint,
      )

      const tx = await client.formTransaction({
        // TODO: Fix program type once HPL is upgraded to anchor v0.26
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program: program as any,
        provider: anchorProvider,
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
    if (!anchorProvider) return
    const { connection } = anchorProvider

    if (mint && program && anchorProvider) {
      const rewards = await client.getCurrentRewards(
        // TODO: Fix program type once HPL is upgraded to anchor v0.26
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program as any,
        IOT_LAZY_KEY,
        mint,
      )

      const tx = await client.formTransaction({
        // TODO: Fix program type once HPL is upgraded to anchor v0.26
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program: program as any,
        provider: anchorProvider,
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
