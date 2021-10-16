import { useQuery } from '@apollo/client'
import { useCallback, useEffect, useState } from 'react'
import { ACCOUNT_ACTIVITY_QUERY } from '../../graphql/account'
import {
  AccountActivity,
  AccountActivityVariables,
} from '../../graphql/__generated__/AccountActivity'

export default (address?: string) => {
  const { data, fetchMore, loading, error } = useQuery<
    AccountActivity,
    AccountActivityVariables
  >(ACCOUNT_ACTIVITY_QUERY, {
    variables: {
      cursor: '',
      address,
    },
    fetchPolicy: 'cache-and-network',
    skip: !address,
    notifyOnNetworkStatusChange: true,
    pollInterval: 60000, // Every minute check for new activity
  })

  const [now, setNow] = useState(new Date())

  const requestMore = useCallback(() => {
    if (!data?.accountActivity?.cursor || !address) return

    fetchMore({
      variables: {
        cursor: data.accountActivity.cursor,
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
