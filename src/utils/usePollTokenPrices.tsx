import { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { useAppDispatch } from '../store/store'
import { readTokenPrices } from '../store/slices/balancesSlice'

export const usePollTokenPrices = () => {
  const { currency } = useAppStorage()
  const apiToken = useSelector((state: RootState) => state.auth.apiToken)
  const initialFetch = useRef(false)
  const dispatch = useAppDispatch()
  const tokenPrices = useSelector(
    (state: RootState) => state.balances.tokenPrices,
  )

  const getTokenPrices = useCallback(() => {
    if (!currency || !apiToken) return
    dispatch(
      readTokenPrices({
        currency: currency.toLowerCase(),
      }),
    )
  }, [apiToken, currency, dispatch])

  useEffect(() => {
    if (initialFetch.current) return

    initialFetch.current = true
    getTokenPrices()
  }, [apiToken, getTokenPrices])

  useEffect(() => {
    const interval = setInterval(() => {
      getTokenPrices()
    }, 5 * 60000) // Every 5 mins
    return () => clearInterval(interval)
  }, [getTokenPrices])

  return { tokenPrices }
}
