import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useSelector } from 'react-redux'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { useAppDispatch } from '../store/store'
import { readBalanceHistory } from '../store/slices/balancesSlice'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useSolana } from '../solana/SolanaProvider'
import { SyncGuard } from './syncGuard'

// Global balance history sync guard to prevent overlapping requests
const balanceHistorySyncGuard = new SyncGuard()

export const useBalanceHistory = () => {
  const { currentAccount } = useAccountStorage()
  const { currency } = useAppStorage()
  const { cluster } = useSolana()
  const dispatch = useAppDispatch()
  const appState = useRef(AppState.currentState)
  const prevQuery = useRef('')

  const balanceHistory = useSelector(
    (state: RootState) =>
      state.balances.balanceHistory[cluster]?.[
        currentAccount?.solanaAddress || ''
      ]?.[currency],
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        currentAccount?.solanaAddress &&
        currency &&
        cluster
      ) {
        const syncKey = `${cluster}-${currentAccount.solanaAddress}-${currency}`

        // Check if sync can proceed
        if (!balanceHistorySyncGuard.canSync(syncKey)) {
          appState.current = nextAppState
          return
        }

        balanceHistorySyncGuard.startSync(syncKey)

        dispatch(
          readBalanceHistory({
            cluster,
            solanaAddress: currentAccount?.solanaAddress || '',
            currency,
          }),
        ).finally(() => {
          balanceHistorySyncGuard.endSync()
        })
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!cluster || !currentAccount?.solanaAddress || !currency) {
      return
    }

    const query = `${cluster}.${currentAccount.solanaAddress}.${currency}`

    if (query === prevQuery.current) return

    prevQuery.current = query

    // Check if sync can proceed
    if (!balanceHistorySyncGuard.canSync(query)) {
      return
    }

    balanceHistorySyncGuard.startSync(query)

    dispatch(
      readBalanceHistory({
        cluster,
        solanaAddress: currentAccount?.solanaAddress,
        currency,
      }),
    ).finally(() => {
      balanceHistorySyncGuard.endSync()
    })
  }, [cluster, currency, currentAccount?.solanaAddress, dispatch])

  return { balanceHistory }
}
