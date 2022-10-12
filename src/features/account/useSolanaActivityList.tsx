import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { RootState } from '../../store/rootReducer'
import { getTxns } from '../../store/slices/solanaSlice'
import { useAppDispatch } from '../../store/store'
import { TokenType } from '../../types/activity'
import { FilterType } from './AccountActivityFilter'

export default ({
  account,
  filter,
  tokenType,
}: {
  account?: CSAccount | null
  filter: FilterType
  tokenType: TokenType
}) => {
  const [now, setNow] = useState(new Date())
  const dispatch = useAppDispatch()
  const { l1Network } = useAppStorage()
  const solanaActivity = useSelector(
    (state: RootState) => state.solana.activity,
  )

  const isSolana = useMemo(() => l1Network === 'solana_dev', [l1Network])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!account?.address || !isSolana) return
      dispatch(getTxns({ account, tokenType, requestType: 'update_head' }))
    }, 5000) // Every 5 seconds update the head of the list
    return () => clearInterval(interval)
  }, [account, dispatch, isSolana, tokenType])

  useEffect(() => {
    if (!account?.address || !isSolana) return

    dispatch(getTxns({ account, tokenType, requestType: 'start_fresh' }))
  }, [account, dispatch, filter, isSolana, tokenType])

  const requestMore = useCallback(() => {
    if (!account?.address || !isSolana) return

    dispatch(getTxns({ account, tokenType, requestType: 'fetch_more' }))
  }, [account, dispatch, isSolana, tokenType])

  const data = useMemo(() => {
    if (!account?.solanaAddress) return []

    if (
      (filter !== 'payment' && filter !== 'all') ||
      !solanaActivity?.data?.[account.solanaAddress]
    )
      return []

    return solanaActivity.data[account.solanaAddress][filter][tokenType]
  }, [account, filter, solanaActivity.data, tokenType])

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
