import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { useSelector } from 'react-redux'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { useAppDispatch } from '../store/store'
import { readBalanceHistory } from '../store/slices/balancesSlice'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useSolana } from '../solana/SolanaProvider'

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
        dispatch(
          readBalanceHistory({
            cluster,
            solanaAddress: currentAccount?.solanaAddress,
            currency,
          }),
        )
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

    dispatch(
      readBalanceHistory({
        cluster,
        solanaAddress: currentAccount?.solanaAddress,
        currency,
      }),
    )
  }, [cluster, currency, currentAccount?.solanaAddress, dispatch])

  return { balanceHistory }
}
