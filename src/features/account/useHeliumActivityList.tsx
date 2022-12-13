import { useCallback, useEffect, useMemo, useState } from 'react'
import { differenceBy } from 'lodash'
import { Ticker } from '@helium/currency'
import {
  useAccountActivityLazyQuery,
  useAccountActivityQuery,
  usePendingTxnsLazyQuery,
  usePendingTxnsQuery,
  Activity as HeliumActivity,
} from '../../generated/graphql'
import { FilterType } from './AccountActivityFilter'
import useAppear from '../../hooks/useAppear'
import { CSAccount } from '../../storage/cloudStorage'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { Activity } from '../../types/activity'

const AccountActivityAPIFilters = {
  all: ['all'],
  mining: ['rewards_v1', 'rewards_v2', 'subnetwork_rewards_v1'],
  payment: ['payment_v1', 'payment_v2', 'token_redeem_v1'],
  hotspotAndValidators: [
    'add_gateway_v1',
    'assert_location_v1',
    'assert_location_v2',
    'transfer_hotspot_v1',
    'transfer_hotspot_v2',
    'unstake_validator_v1',
    'stake_validator_v1',
    'transfer_validator_stake_v1',
  ],
  burn: ['token_burn_v1'],
  pending: [],
} as Record<FilterType, string[]>

export default ({
  account,
  filter,
  ticker,
}: {
  account?: CSAccount | null
  filter: FilterType
  ticker: Ticker
}) => {
  const { l1Network } = useAppStorage()
  const address = useMemo(() => account?.address, [account])
  const isHelium = useMemo(() => l1Network === 'helium', [l1Network])

  const {
    data: activityData,
    fetchMore,
    loading,
    error,
  } = useAccountActivityQuery({
    variables: {
      cursor: '',
      address: address || '',
      filter: AccountActivityAPIFilters[filter].join(','),
    },
    fetchPolicy: 'cache-and-network',
    skip: !address || filter === 'pending' || !isHelium,
    notifyOnNetworkStatusChange: true,
    pollInterval: 30000,
  })

  const { data: pendingData } = usePendingTxnsQuery({
    variables: {
      address: address || '',
    },
    fetchPolicy: 'network-only',
    skip: !address || !isHelium,
    pollInterval: 9000,
  })

  const [getPendingLazy] = usePendingTxnsLazyQuery({
    variables: {
      address: address || '',
    },
    fetchPolicy: 'network-only',
  })
  const getPendingTxns = useCallback(() => {
    if (!isHelium) return
    getPendingLazy()
  }, [getPendingLazy, isHelium])

  useAppear(getPendingTxns)

  const [getTxns, { loading: loadingActivityLazy }] =
    useAccountActivityLazyQuery({
      variables: {
        cursor: '',
        address: address || '',
        filter: AccountActivityAPIFilters[filter].join(','),
      },
      notifyOnNetworkStatusChange: true,
      fetchPolicy: 'cache-first',
    })

  useEffect(() => {
    if (!address || filter === 'pending' || !isHelium) return

    getTxns()
  }, [address, filter, getTxns, isHelium, l1Network])

  const [now, setNow] = useState(new Date())

  const requestMore = useCallback(() => {
    if (
      !activityData?.accountActivity?.cursor ||
      !address ||
      filter === 'pending' ||
      !isHelium
    )
      return

    fetchMore({
      variables: {
        cursor: activityData.accountActivity?.cursor,
        address,
      },
    })
  }, [activityData, address, filter, isHelium, fetchMore])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  const data = useMemo((): Activity[] => {
    const pending = pendingData?.pendingTxns || []
    if (filter === 'pending') {
      return pending.map((p) => ({
        ...p,
        payments: (p?.payments || []).map((pay) => ({
          ...pay,
          tokenType: pay.tokenType?.toUpperCase() as Ticker,
        })),
      }))
    }
    const dataForFilter = activityData?.accountActivity?.data || []

    let activities = [] as HeliumActivity[]
    if (filter === 'all') {
      activities = [
        ...differenceBy(pending, dataForFilter, 'hash'),
        ...dataForFilter,
      ]
    }

    const filteredPending = pending.filter(({ type }) =>
      AccountActivityAPIFilters[filter].includes(type),
    )
    const dedupedPending = differenceBy(filteredPending, dataForFilter, 'hash')

    activities = [...dedupedPending, ...dataForFilter]

    return activities.map((p) => ({
      ...p,
      tokenType: p.tokenType?.toUpperCase() as Ticker,
      payments: (p?.payments || []).map((pay) => ({
        ...pay,
        tokenType: pay.tokenType?.toUpperCase() as Ticker,
      })),
    }))
  }, [activityData, filter, pendingData])

  const filteredTxns = useMemo(() => {
    if (filter === 'payment') {
      return data.filter(
        (txn) =>
          txn.payments &&
          txn.payments.some((p) =>
            ticker === 'HNT'
              ? !p.tokenType || p.tokenType.toUpperCase() === 'HNT'
              : p.tokenType?.toUpperCase() === ticker,
          ),
      )
    }

    return data.filter((txn: Activity) =>
      ticker === 'HNT'
        ? !txn.tokenType || txn.tokenType.toUpperCase() === 'HNT'
        : txn.tokenType?.toUpperCase() === ticker,
    )
  }, [data, filter, ticker])

  return {
    data: filteredTxns,
    error,
    loading: loading || loadingActivityLazy,
    requestMore,
    now,
  }
}
