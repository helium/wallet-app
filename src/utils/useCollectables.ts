import { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import {
  fetchCollectables,
  WalletCollectables,
} from '../store/slices/collectablesSlice'
import { useAppDispatch } from '../store/store'
import { onLogs, removeAccountChangeListener } from './solanaUtils'

const useCollectables = (): WalletCollectables & { refresh: () => void } => {
  const { solanaNetwork: cluster, l1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const accountSubscriptionId = useRef<number>()
  const { currentAccount } = useAccountStorage()
  const collectables = useSelector((state: RootState) => state.collectables)

  const refresh = useCallback(() => {
    if (!currentAccount?.solanaAddress || l1Network !== 'solana') {
      return
    }
    dispatch(fetchCollectables({ account: currentAccount, cluster }))
  }, [cluster, currentAccount, dispatch, l1Network])

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
    }
  }

  return { ...collectables[currentAccount?.solanaAddress], refresh }
}
export default useCollectables
