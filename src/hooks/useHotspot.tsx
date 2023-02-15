import * as client from '@helium/distributor-oracle'
import { PublicKey } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import useSubmitTxn from '../graphql/useSubmitTxn'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { IOT_LAZY_KEY, MOBILE_LAZY_KEY } from '../utils/constants'
import { useProgram } from '../utils/hotspotNftsUtils'
import * as Logger from '../utils/logger'
import { getConnection } from '../utils/solanaUtils'

export function useHotspot(mint: PublicKey): {
  iotRewardsError: Error | undefined
  mobileRewardsError: Error | undefined
  claimIotRewards: () => Promise<void>
  claimMobileRewards: () => Promise<void>
  iotRewardsLoading: boolean
  mobileRewardsLoading: boolean
} {
  const { solanaNetwork: cluster } = useAppStorage()
  const conn = getConnection(cluster)

  const program = useProgram()
  const [error, setError] = useState<string | null>(null)
  const { submitClaimRewards } = useSubmitTxn()
  const { anchorProvider } = useAccountStorage()

  const {
    error: mobileRewardsError,
    execute: claimMobileRewards,
    loading: mobileRewardsLoading,
  } = useAsyncCallback(async () => {
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
        assetEndpoint: conn.rpcEndpoint,
      })

      await submitClaimRewards(tx)
    }
  })

  const {
    error: iotRewardsError,
    execute: claimIotRewards,
    loading: iotRewardsLoading,
  } = useAsyncCallback(async () => {
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
        assetEndpoint: conn.rpcEndpoint,
      })

      await submitClaimRewards(tx)
    }
  })

  useEffect(() => {
    if (mobileRewardsError) {
      Logger.error(mobileRewardsError)
      setError(mobileRewardsError.message)
    }
  }, [error, mobileRewardsError])

  return {
    claimMobileRewards,
    claimIotRewards,
    mobileRewardsLoading,
    iotRewardsLoading,
    iotRewardsError,
    mobileRewardsError,
  }
}
