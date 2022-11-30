/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { recipientKey as getRecipientKey } from '@helium/lazy-distributor-sdk'
import { PublicKey } from '@solana/web3.js'
import { JsonMetadata, Metadata } from '@metaplex-foundation/js'
import { useAsync } from 'react-async-hook'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { fetchCollectables } from '../store/slices/collectablesSlice'
import { useAppDispatch } from '../store/store'
import { onLogs, removeAccountChangeListener } from './solanaUtils'
import { getPendingRewards, LAZY_KEY, useProgram } from './hotspotNftsUtils'
import { useRecipients } from './useRecipients'
import { Collectable } from '../types/solana'

const useHotspots = (): {
  hotspots: Metadata<JsonMetadata<string>>[]
  hotspotsWithMeta: Collectable[]
  loading: boolean
  refresh: () => void
  allPendingRewards: number
} => {
  const { solanaNetwork: cluster, l1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const accountSubscriptionId = useRef<number>()
  const [allPendingRewards, setAllPendingRewards] = useState<number>(0)
  const { currentAccount } = useAccountStorage()
  const collectables = useSelector((state: RootState) => state.collectables)
  const hotspots = useMemo(() => {
    if (!currentAccount?.solanaAddress) return []
    return collectables[currentAccount?.solanaAddress].collectablesWithMeta
      .HOTSPOT
  }, [collectables, currentAccount])

  const program = useProgram()
  const recipientKeys = useMemo(() => {
    if (!hotspots) return []

    return hotspots
      .map((hotspot) => {
        return {
          [hotspot.mint.address.toString()]: getRecipientKey(
            LAZY_KEY,
            new PublicKey(hotspot.mint.address),
          )[0],
        }
      })
      .reduce((acc, cur) => ({ ...acc, ...cur }), {})
  }, [hotspots])
  const recipients = useRecipients(
    Object.keys(recipientKeys).map((k) => recipientKeys[k]),
  )

  const refresh = useCallback(() => {
    if (
      !currentAccount?.solanaAddress ||
      l1Network !== 'solana' ||
      collectables.loading
    ) {
      return
    }
    dispatch(fetchCollectables({ account: currentAccount, cluster }))
  }, [cluster, collectables.loading, currentAccount, dispatch, l1Network])

  // TODO: Fix/test this with compressed hotspots once metaplex pushes fix
  // useAsync(async () => {
  //   if (
  //     !currentAccount?.solanaAddress ||
  //     collectables[currentAccount?.solanaAddress].collectables.HOTSPOT
  //       .length === 0
  //   ) {
  //     return
  //   }

  //   const hotspotRewards = await Promise.all(
  //     Object.keys(recipientKeys).map(async (rec) => {
  //       const { info: recipient, loading } = recipients[rec]
  //       if (loading) return { pendingRewards: 0 }
  //       const pendingRewards = await getPendingRewards(
  //         program as any,
  //         new PublicKey(rec),
  //         recipient,
  //       )
  //       return pendingRewards
  //     }),
  //   )

  //   const totalRewards = hotspotRewards.reduce(
  //     (a, b) => a + b.pendingRewards,
  //     0,
  //   )

  //   setAllPendingRewards(totalRewards)
  // }, [collectables, currentAccount, program])

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return

    refresh()

    const subId = onLogs(cluster, currentAccount?.solanaAddress, () => {
      refresh()
    })

    if (accountSubscriptionId.current !== undefined) {
      removeAccountChangeListener(cluster, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
  }, [cluster, currentAccount, dispatch, l1Network, refresh])

  if (
    !currentAccount?.solanaAddress ||
    !collectables[currentAccount?.solanaAddress]
  ) {
    return {
      loading: false,
      hotspots: [],
      hotspotsWithMeta: [],
      allPendingRewards,
      refresh,
    }
  }

  return {
    hotspots:
      collectables[currentAccount?.solanaAddress].collectables.HOTSPOT || [],

    hotspotsWithMeta:
      collectables[currentAccount?.solanaAddress].collectablesWithMeta
        .HOTSPOT || [],
    loading: collectables[currentAccount?.solanaAddress].loading,
    allPendingRewards,
    refresh,
  }
}
export default useHotspots
