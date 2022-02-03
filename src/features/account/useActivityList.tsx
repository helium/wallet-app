import { useCallback, useEffect, useState } from 'react'
import { useAccountActivityQuery } from '../../generated/graphql'

export default ({ address, skip }: { address?: string; skip: boolean }) => {
  const { data, fetchMore, loading, error } = useAccountActivityQuery({
    variables: {
      cursor: '',
      address: address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip,
    notifyOnNetworkStatusChange: true,
    pollInterval: 60000, // Every minute check for new activity
  })

  const [now, setNow] = useState(new Date())

  const requestMore = useCallback(() => {
    if (!data?.accountActivity?.cursor || !address) return

    fetchMore({
      variables: {
        cursor: data.accountActivity?.cursor,
        address,
      },
    })
  }, [address, data, fetchMore])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  return { data, error, loading, requestMore, now }
}
