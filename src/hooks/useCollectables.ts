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
import { useSolana } from '../solana/SolanaProvider'
import { SyncGuard } from '../utils/syncGuard'

// Global collectables sync guard to prevent overlapping requests
const collectablesSyncGuard = new SyncGuard()

const useCollectables = (): WalletCollectables & {
  refresh: () => void
} => {
  const { cluster, anchorProvider } = useSolana()
  const dispatch = useAppDispatch()
  const accountSubscriptionId = useRef<number | null>(null)
  const { currentAccount } = useAccountStorage()
  const { locked } = useAppStorage()
  const collectables = useSelector((state: RootState) => state.collectables)

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return
    // Reset loading on mount
    dispatch(
      collectablesSli.actions.resetLoading({ acct: currentAccount, cluster }),
    )
  }, [cluster, currentAccount, dispatch])

  const refresh = useCallback(() => {
    if (!currentAccount?.solanaAddress || !anchorProvider) {
      return
    }

    const syncKey = `${cluster}-${currentAccount.solanaAddress}`

    // Check if sync can proceed
    if (!collectablesSyncGuard.canSync(syncKey)) {
      return
    }

    collectablesSyncGuard.startSync(syncKey)

    const { connection } = anchorProvider

    dispatch(
      fetchCollectables({
        account: currentAccount,
        cluster,
        connection,
      }),
    ).finally(() => {
      collectablesSyncGuard.endSync()
    })
  }, [cluster, currentAccount, dispatch, anchorProvider])

  useEffect(() => {
    // Don't fetch collectables while locked - wait until unlock
    if (!currentAccount?.solanaAddress || !anchorProvider || locked) return

    refresh()

    const subId = onLogs(
      anchorProvider,
      currentAccount?.solanaAddress || '',
      () => {
        refresh()
      },
    )

    if (accountSubscriptionId.current !== null) {
      removeAccountChangeListener(anchorProvider, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId

    return () => {
      if (accountSubscriptionId.current !== null) {
        removeAccountChangeListener(
          anchorProvider,
          accountSubscriptionId.current,
        )
        accountSubscriptionId.current = null
      }
    }
  }, [anchorProvider, currentAccount, dispatch, refresh, locked])

  if (
    !currentAccount?.solanaAddress ||
    !collectables[cluster]?.[currentAccount?.solanaAddress]
  ) {
    return {
      loading: false,
      collectables: {},
      collectablesWithMeta: {},
      refresh,
    }
  }

  return {
    ...collectables[cluster][currentAccount?.solanaAddress],
    refresh,
  }
}
export default useCollectables
