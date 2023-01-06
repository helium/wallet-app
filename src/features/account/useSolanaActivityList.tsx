import { Ticker } from '@helium/currency'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { RootState } from '../../store/rootReducer'
import { getTxns } from '../../store/slices/solanaSlice'
import { useGetMintsQuery } from '../../store/slices/walletRestApi'
import { useAppDispatch } from '../../store/store'
import { FilterType } from './AccountActivityFilter'

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
  const { l1Network, solanaNetwork: cluster } = useAppStorage()
  const solanaActivity = useSelector(
    (state: RootState) => state.solana.activity,
  )
  const { data: mints } = useGetMintsQuery(cluster, {
    refetchOnMountOrArgChange: true,
  })

  const isSolana = useMemo(() => l1Network === 'solana', [l1Network])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!account?.address || !isSolana || !mints) return
      dispatch(
        getTxns({
          account,
          ticker,
          mints,
          requestType: 'update_head',
          cluster,
        }),
      )
    }, 5000) // Every 5 seconds update the head of the list
    return () => clearInterval(interval)
  }, [account, cluster, dispatch, isSolana, mints, ticker])

  useEffect(() => {
    if (!account?.address || !isSolana || !mints) return

    dispatch(
      getTxns({
        account,
        ticker,
        mints,
        requestType: 'start_fresh',
        cluster,
      }),
    )
  }, [account, cluster, dispatch, filter, isSolana, mints, ticker])

  const requestMore = useCallback(() => {
    if (!account?.address || !isSolana || !mints) return

    dispatch(
      getTxns({
        account,
        mints,
        ticker,
        requestType: 'fetch_more',
        cluster,
      }),
    )
  }, [account, cluster, dispatch, isSolana, mints, ticker])

  const data = useMemo(() => {
    if (!account?.solanaAddress) return []

    if (
      (filter !== 'payment' && filter !== 'all') ||
      !solanaActivity?.data?.[account.solanaAddress]
    )
      return []

    return solanaActivity.data[account.solanaAddress][filter][ticker]
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
