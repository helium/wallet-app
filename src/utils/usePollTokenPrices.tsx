import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { useAppDispatch } from '../store/store'
import { readTokenPrices } from '../store/slices/balancesSlice'
import usePrevious from '../hooks/usePrevious'

// Global token prices sync guard to prevent overlapping requests
let isTokenPricesSyncing = false
let lastTokenPricesSyncKey = ''
let tokenPricesCooldownTimer: ReturnType<typeof setTimeout> | null = null

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

    // Check if sync is already in progress
    if (isTokenPricesSyncing) {
      return
    }

    // Check cooldown (30 seconds for token prices)
    if (lastTokenPricesSyncKey === syncKey) {
      return
    }

    isTokenPricesSyncing = true
    lastTokenPricesSyncKey = syncKey

    // Clear any existing cooldown timer
    if (tokenPricesCooldownTimer) {
      clearTimeout(tokenPricesCooldownTimer)
    }

    dispatch(
      readTokenPrices({
        currency: currency.toLowerCase(),
      }),
    ).finally(() => {
      isTokenPricesSyncing = false

      // Set cooldown for 30 seconds
      tokenPricesCooldownTimer = setTimeout(() => {
        lastTokenPricesSyncKey = ''
        tokenPricesCooldownTimer = null
      }, 30000)
    })
  }, [apiToken, currency, dispatch])

  useEffect(() => {
    if (currency === prevCurrency) return

    getTokenPrices()
  }, [apiToken, currency, getTokenPrices, prevCurrency])

  useEffect(() => {
    // Delay initial token prices fetch by 2s to spread out initial load
    const initialTimer = setTimeout(() => {
      getTokenPrices()
    }, 2000)

    const interval = setInterval(() => {
      getTokenPrices()
    }, 60000) // Every 1 min

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [getTokenPrices])

  return { tokenPrices }
}
