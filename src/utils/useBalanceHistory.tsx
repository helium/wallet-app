import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useSelector } from 'react-redux'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { useAppDispatch } from '../store/store'
import { readBalanceHistory } from '../store/slices/balancesSlice'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useSolana } from '../solana/SolanaProvider'

// Global balance history sync guard to prevent overlapping requests
let isBalanceHistorySyncing = false
let lastBalanceHistorySyncKey = ''
let balanceHistoryCooldownTimer: ReturnType<typeof setTimeout> | null = null

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

        // Check if sync is already in progress
        if (isBalanceHistorySyncing) {
          appState.current = nextAppState
          return
        }

        // Check cooldown (15 seconds)
        if (lastBalanceHistorySyncKey === syncKey) {
          appState.current = nextAppState
          return
        }

        isBalanceHistorySyncing = true
        lastBalanceHistorySyncKey = syncKey

        // Clear any existing cooldown timer
        if (balanceHistoryCooldownTimer) {
          clearTimeout(balanceHistoryCooldownTimer)
        }

        // Delay balance history fetch by 8s to spread out after other providers
        setTimeout(() => {
          dispatch(
            readBalanceHistory({
              cluster,
              solanaAddress: currentAccount?.solanaAddress || '',
              currency,
            }),
          ).finally(() => {
            isBalanceHistorySyncing = false

            // Set cooldown for 15 seconds
            balanceHistoryCooldownTimer = setTimeout(() => {
              lastBalanceHistorySyncKey = ''
              balanceHistoryCooldownTimer = null
            }, 15000)
          })
        }, 8000)
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

    // Check if sync is already in progress
    if (isBalanceHistorySyncing) {
      return
    }

    // Check cooldown
    if (lastBalanceHistorySyncKey === query) {
      return
    }

    isBalanceHistorySyncing = true
    lastBalanceHistorySyncKey = query

    // Clear any existing cooldown timer
    if (balanceHistoryCooldownTimer) {
      clearTimeout(balanceHistoryCooldownTimer)
    }

    dispatch(
      readBalanceHistory({
        cluster,
        solanaAddress: currentAccount?.solanaAddress,
        currency,
      }),
    ).finally(() => {
      isBalanceHistorySyncing = false

      // Set cooldown for 15 seconds
      balanceHistoryCooldownTimer = setTimeout(() => {
        lastBalanceHistorySyncKey = ''
        balanceHistoryCooldownTimer = null
      }, 15000)
    })
  }, [cluster, currency, currentAccount?.solanaAddress, dispatch])

  return { balanceHistory }
}
