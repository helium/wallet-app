import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { useAppDispatch } from '../store/store'
import { readTokenPrices } from '../store/slices/balancesSlice'
import usePrevious from '../hooks/usePrevious'
import { SyncGuard } from './syncGuard'

// Global token prices sync guard to prevent overlapping requests
const tokenPricesSyncGuard = new SyncGuard()

export const usePollTokenPrices = () => {
  const { currency } = useAppStorage()
  const prevCurrency = usePrevious(currency)
  const apiToken = useSelector((state: RootState) => state.auth.apiToken)
  const dispatch = useAppDispatch()
  const tokenPrices = useSelector(
    (state: RootState) => state.balances.tokenPrices,
  )

  const getTokenPrices = useCallback(() => {
    if (!currency || !apiToken) return

    const syncKey = currency.toLowerCase()

    // Check if sync can proceed
    if (!tokenPricesSyncGuard.canSync(syncKey)) {
      return
    }

    tokenPricesSyncGuard.startSync(syncKey)

    dispatch(
      readTokenPrices({
        currency: currency.toLowerCase(),
      }),
    ).finally(() => {
      tokenPricesSyncGuard.endSync()
    })
  }, [apiToken, currency, dispatch])

  useEffect(() => {
    if (currency === prevCurrency) return

    getTokenPrices()
  }, [apiToken, currency, getTokenPrices, prevCurrency])

  useEffect(() => {
    getTokenPrices()

    const interval = setInterval(() => {
      getTokenPrices()
    }, 60000) // Every 1 min

    return () => {
      clearInterval(interval)
    }
  }, [getTokenPrices])

  return { tokenPrices }
}
