import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import {
  fetchCollectables,
  fetchMoreCollectables,
  WalletCollectables,
} from '../store/slices/collectablesSlice'
import { useAppDispatch } from '../store/store'
import { onLogs, removeAccountChangeListener } from '../utils/solanaUtils'

const useCollectables = (): WalletCollectables & {
  refresh: () => void
  fetchMore: () => void
} => {
  const { solanaNetwork: cluster, l1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const accountSubscriptionId = useRef<number>()
  const { currentAccount } = useAccountStorage()
  const collectables = useSelector((state: RootState) => state.collectables)

  const fetchingMore = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !collectables[currentAccount?.solanaAddress]
    )
      return false
    return collectables[currentAccount?.solanaAddress].fetchingMore
  }, [collectables, currentAccount])

  const oldestCollectableId = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !collectables[currentAccount?.solanaAddress]
    )
      return ''
    return collectables[currentAccount?.solanaAddress].oldestCollectableId
  }, [collectables, currentAccount])

  const onEndReached = useMemo(() => {
    if (
      !currentAccount?.solanaAddress ||
      !collectables[currentAccount?.solanaAddress]
    )
      return false
    return collectables[currentAccount?.solanaAddress].onEndReached
  }, [collectables, currentAccount])

  const refresh = useCallback(() => {
    if (
      !currentAccount?.solanaAddress ||
      !collectables[currentAccount?.solanaAddress] ||
      l1Network !== 'solana' ||
      collectables[currentAccount?.solanaAddress].loading
    ) {
      return
    }
    dispatch(
      fetchCollectables({
        account: currentAccount,
        cluster,
      }),
    )
  }, [cluster, collectables, currentAccount, dispatch, l1Network])

  const fetchMore = useCallback(() => {
    if (
      !currentAccount?.solanaAddress ||
      !collectables[currentAccount?.solanaAddress] ||
      l1Network !== 'solana' ||
      collectables[currentAccount?.solanaAddress].loading
    ) {
      return
    }
    dispatch(
      fetchMoreCollectables({
        account: currentAccount,
        cluster,
        oldestCollectable: oldestCollectableId,
      }),
    )
  }, [
    cluster,
    collectables,
    currentAccount,
    dispatch,
    l1Network,
    oldestCollectableId,
  ])

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
      collectables: {},
      collectablesWithMeta: {},
      refresh,
      fetchMore,
      fetchingMore,
      onEndReached,
      oldestCollectableId,
    }
  }

  return {
    ...collectables[currentAccount?.solanaAddress],
    refresh,
    fetchMore,
    fetchingMore,
  }
}
export default useCollectables
