import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useAppStorage } from '../storage/AppStorageProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useSolana } from '../solana/SolanaProvider'
import { balanceHistoryQueryOptions } from './balances'

export const useBalanceHistory = () => {
  const { currentAccount } = useAccountStorage()
  const { currency } = useAppStorage()
  const { cluster } = useSolana()
  const appState = useRef(AppState.currentState)
  const solanaAddress = currentAccount?.solanaAddress || ''
  const enabled = !!cluster && !!solanaAddress && !!currency

  const { data: balanceHistory, refetch } = useQuery({
    ...balanceHistoryQueryOptions({ cluster, solanaAddress, currency }),
    enabled,
  })

  // Read the history again when the app comes back to the foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        enabled &&
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Join a fetch in flight instead of restarting it
        refetch({ cancelRefetch: false })
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [enabled, refetch])

  return { balanceHistory }
}
