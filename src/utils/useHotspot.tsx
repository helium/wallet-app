import { PublicKey } from '@solana/web3.js'
import { useEffect, useMemo, useState } from 'react'
import { recipientKey as getRecipientKey } from '@helium/lazy-distributor-sdk'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import * as client from '@helium/distributor-oracle'
import { getPendingRewards, LAZY_KEY, useProgram } from './hotspotNftsUtils'
import { useRecipient } from './useRecipient'
import * as Logger from './logger'
import { useAccountStorage } from '../storage/AccountStorageProvider'

export function useHotspot(mint: PublicKey): {
  pendingRewards: number | null
  claimRewards: () => Promise<void>
  rewardsLoading: boolean
  error: string | null
} {
  const program = useProgram()
  const [pendingRewards, setPendingRewards] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recipientKey = useMemo(() => {
    return getRecipientKey(LAZY_KEY, mint)[0]
  }, [mint])
  const { info: recipient, loading } = useRecipient(recipientKey)

  useAsync(async () => {
    try {
      if (program && !loading) {
        const { pendingRewards: rewards } = await getPendingRewards(
          program,
          mint,
          recipient,
        )
        setPendingRewards(rewards)
      }
    } catch (e) {
      Logger.error(e)
    }
  }, [mint, program])

  const { anchorProvider } = useAccountStorage()

  const {
    error: rewardsError,
    execute,
    loading: rewardsLoading,
  } = useAsyncCallback(async () => {
    if (mint && program && anchorProvider) {
      if (loading) return
      const rewards = await client.getCurrentRewards(
        // TODO: Fix program type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program as any,
        LAZY_KEY,
        mint,
      )

      const tx = await client.formTransaction({
        // TODO: Fix program type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        program: program as any,
        provider: anchorProvider,
        rewards,
        hotspot: mint,
        lazyDistributor: LAZY_KEY,
      })

      // TODO: Send this transaction via Solana Slice
      await anchorProvider.sendAndConfirm(tx)
    }
  })

  useEffect(() => {
    if (rewardsError) {
      Logger.error(rewardsError)
      setError(rewardsError.message)
    }
  }, [error, rewardsError])

  return { pendingRewards, claimRewards: execute, rewardsLoading, error }
}
