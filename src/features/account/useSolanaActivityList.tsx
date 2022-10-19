import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
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
  // TODO: Can this be removed?
  const [now, setNow] = useState(new Date())
  const dispatch = useAppDispatch()

  const solanaActivities = useSelector(
    (state: RootState) => state.solana.activities,
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!account?.address) return
    dispatch(getTxns({ account, tokenType }))
  }, [account, dispatch, filter, tokenType])

  const requestMore = useCallback(() => {}, [])

  const data = useMemo(() => {
    if (!account?.solanaAddress) return []

    if (
      (filter !== 'payment' && filter !== 'all') ||
      !solanaActivities?.data?.[account.solanaAddress]
    )
      return []

    return solanaActivities.data[account.solanaAddress][filter]
  }, [account, filter, solanaActivities])

  const loading = useMemo(() => {
    return solanaActivities.loading
  }, [solanaActivities.loading])

  const error = useMemo(() => {
    return solanaActivities.error
  }, [solanaActivities.error])

  return {
    data,
    error,
    loading,
    requestMore,
    now,
  }
}
