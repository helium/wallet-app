import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { useAppDispatch } from '../store/store'
import { readTokenPrices } from '../store/slices/balancesSlice'
import usePrevious from '../hooks/usePrevious'

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
    dispatch(
      readTokenPrices({
        currency: currency.toLowerCase(),
      }),
    )
  }, [apiToken, currency, dispatch])

  useEffect(() => {
    if (currency === prevCurrency) return

    getTokenPrices()
  }, [apiToken, currency, getTokenPrices, prevCurrency])

  useEffect(() => {
    const interval = setInterval(() => {
      getTokenPrices()
    }, 60000) // Every 1 min
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { tokenPrices }
}
