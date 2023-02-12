import { PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useState } from 'react'
import { recipientKey as getRecipientKey } from '@helium/lazy-distributor-sdk'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import * as client from '@helium/distributor-oracle'
import {
  getPendingRewards,
  useProgram,
  MOBILE_LAZY_KEY,
  IOT_LAZY_KEY,
} from '../utils/hotspotNftsUtils'
import { useRecipient } from './useRecipient'
import * as Logger from '../utils/logger'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import useSubmitTxn from '../graphql/useSubmitTxn'

export function useHotspot(mint: PublicKey): {
  iotRewardsError: Error | undefined
  mobileRewardsError: Error | undefined
  pendingIotRewards: number | null
  pendingMobileRewards: number | null
  claimIotRewards: () => Promise<void>
  claimMobileRewards: () => Promise<void>
  iotRewardsLoading: boolean
  mobileRewardsLoading: boolean
} {
  const program = useProgram()
  const [pendingMobileRewards, setPendingMobileRewards] = useState<
    number | null
  >(null)
  const [pendingIotRewards, setPendingIotRewards] = useState<number | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const recipientMobileKey = useMemo(() => {
    return getRecipientKey(MOBILE_LAZY_KEY, mint)[0]
  }, [mint])
  const recipientIotKey = useMemo(() => {
    return getRecipientKey(IOT_LAZY_KEY, mint)[0]
  }, [mint])
  const { info: mobileRecipient, loading: mobileLoading } =
    useRecipient(recipientMobileKey)
  const { info: iotRecipient, loading: iotLoading } =
    useRecipient(recipientIotKey)
  const { submitClaimRewards } = useSubmitTxn()

  useAsync(async () => {
    try {
      if (program && !mobileLoading) {
        const { pendingRewards: mobileRewards } = await getPendingRewards(
          program,
          mint,
          mobileRecipient,
          MOBILE_LAZY_KEY,
        )
        setPendingMobileRewards(mobileRewards)
      }

      if (program && !iotLoading) {
        const { pendingRewards: iotRewards } = await getPendingRewards(
          program,
          mint,
          iotRecipient,
          IOT_LAZY_KEY,
        )
        setPendingIotRewards(iotRewards)
      }
    } catch (e) {
      Logger.error(e)
    }
  }, [mint, program])

  const { anchorProvider } = useAccountStorage()

  const {
    error: mobileRewardsError,
    execute: claimMobileRewards,
    loading: mobileRewardsLoading,
  } = useAsyncCallback(async () => {
    if (mint && program && anchorProvider) {
      if (mobileLoading) return
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
      if (mobileLoading) return
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
    pendingIotRewards,
    pendingMobileRewards,
    claimMobileRewards,
    claimIotRewards,
    mobileRewardsLoading,
    iotRewardsLoading,
    iotRewardsError,
    mobileRewardsError,
  }
}
