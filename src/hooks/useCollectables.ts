import { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import {
  fetchCollectables,
  WalletCollectables,
  collectables as collectablesSli,
} from '../store/slices/collectablesSlice'
import { useAppDispatch } from '../store/store'
import { onLogs, removeAccountChangeListener } from '../utils/solanaUtils'

const useCollectables = (): WalletCollectables & {
  refresh: () => void
} => {
  const { solanaNetwork: cluster, l1Network } = useAppStorage()
  const dispatch = useAppDispatch()
  const accountSubscriptionId = useRef<number>()
  const { currentAccount, anchorProvider } = useAccountStorage()
  const collectables = useSelector((state: RootState) => state.collectables)

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return
    // Reset loading on mount
    dispatch(collectablesSli.actions.resetLoading({ acct: currentAccount }))
  }, [currentAccount, dispatch])

  const refresh = useCallback(() => {
    if (
      !currentAccount?.solanaAddress ||
      l1Network !== 'solana' ||
      !anchorProvider
    ) {
      return
    }
    const { connection } = anchorProvider

    dispatch(
      fetchCollectables({
        account: currentAccount,
        cluster,
        connection,
      }),
    )
  }, [cluster, currentAccount, dispatch, l1Network, anchorProvider])

  useEffect(() => {
    if (!currentAccount?.solanaAddress || !anchorProvider) return

    refresh()

    const subId = onLogs(anchorProvider, currentAccount?.solanaAddress, () => {
      refresh()
    })

    if (accountSubscriptionId.current !== undefined) {
      removeAccountChangeListener(anchorProvider, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
  }, [anchorProvider, currentAccount, dispatch, l1Network, refresh])

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

  return {
    ...collectables[currentAccount?.solanaAddress],
    refresh,
  }
}
export default useCollectables
