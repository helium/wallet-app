import { Ticker } from '@helium/currency'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Mints } from '@utils/constants'
import { CSAccount } from '../../storage/cloudStorage'
import { RootState } from '../../store/rootReducer'
import { getTxns } from '../../store/slices/solanaSlice'
import { useAppDispatch } from '../../store/store'
import { FilterType } from './AccountActivityFilter'
import { useSolana } from '../../solana/SolanaProvider'

export default ({
  account,
  filter,
  ticker,
}: {
  account?: CSAccount | null
  filter: FilterType
  ticker: Ticker
}) => {
  const [now, setNow] = useState(new Date())
  const dispatch = useAppDispatch()
  const { anchorProvider } = useSolana()
  const solanaActivity = useSelector(
    (state: RootState) => state.solana.activity,
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!account?.address || !anchorProvider) return
      dispatch(
        getTxns({
          account,
          ticker,
          mints: Mints,
          requestType: 'update_head',
          anchorProvider,
        }),
      )
    }, 5000) // Every 5 seconds update the head of the list
    return () => clearInterval(interval)
  }, [account, dispatch, ticker, anchorProvider])

  useEffect(() => {
    if (!account?.address || !anchorProvider) return

    dispatch(
      getTxns({
        account,
        ticker,
        mints: Mints,
        requestType: 'start_fresh',
        anchorProvider,
      }),
    )
  }, [account, dispatch, filter, ticker, anchorProvider])

  const requestMore = useCallback(() => {
    if (!account?.address || !anchorProvider) return

    dispatch(
      getTxns({
        account,
        mints: Mints,
        ticker,
        requestType: 'fetch_more',
        anchorProvider,
      }),
    )
  }, [account, dispatch, ticker, anchorProvider])

  const data = useMemo(() => {
    if (!account?.solanaAddress || !solanaActivity.data[account.solanaAddress])
      return []

    if (ticker === 'DC' && (filter === 'delegate' || filter === 'mint')) {
      return solanaActivity.data[account.solanaAddress][filter][ticker]
    }

    if (filter !== 'payment' && filter !== 'all') return []

    return solanaActivity.data[account.solanaAddress][filter][ticker]?.filter(
      (txn) => txn.tokenType === ticker,
    )
  }, [account, filter, solanaActivity.data, ticker])

  const loading = useMemo(() => {
    return solanaActivity.loading
  }, [solanaActivity.loading])

  const error = useMemo(() => {
    return solanaActivity.error
  }, [solanaActivity.error])

  return {
    data,
    error,
    loading,
    requestMore,
    now,
  }
}
