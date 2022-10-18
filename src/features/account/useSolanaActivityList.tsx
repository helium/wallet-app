import { useCallback, useEffect, useMemo, useState } from 'react'
import { TokenType } from '../../generated/graphql'
import { CSAccount } from '../../storage/cloudStorage'
import { FilterType } from './AccountActivityFilter'

export default ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  account,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tokenType,
}: {
  account?: CSAccount | null
  filter: FilterType
  tokenType: TokenType
}) => {
  // TODO: Can this be removed?
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  const requestMore = useCallback(() => {}, [])

  const data = useMemo(() => {
    return []
  }, [])

  const loading = useMemo(() => {
    return true
  }, [])

  const error = useMemo(() => {
    return null
  }, [])

  return {
    data,
    error,
    loading,
    requestMore,
    now,
  }
}
