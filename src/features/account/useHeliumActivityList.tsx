import { useCallback, useEffect, useMemo, useState } from 'react'
import { differenceBy } from 'lodash'
import {
  Activity,
  useAccountActivityLazyQuery,
  useAccountActivityQuery,
  usePendingTxnsLazyQuery,
  usePendingTxnsQuery,
} from '../../generated/graphql'
import { FilterType } from './AccountActivityFilter'
import useAppear from '../../utils/useAppear'
import { CSAccount } from '../../storage/cloudStorage'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { TokenType } from '../../types/activity'

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
  tokenType,
}: {
  account?: CSAccount | null
  filter: FilterType
  tokenType: TokenType
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

  const data = useMemo(() => {
    const pending = pendingData?.pendingTxns || []
    if (filter === 'pending') {
      return pending
    }
    const dataForFilter = activityData?.accountActivity?.data || []

    if (filter === 'all') {
      return [...differenceBy(pending, dataForFilter, 'hash'), ...dataForFilter]
    }

    const filteredPending = pending.filter(({ type }) =>
      AccountActivityAPIFilters[filter].includes(type),
    )
    const dedupedPending = differenceBy(filteredPending, dataForFilter, 'hash')

    return [...dedupedPending, ...dataForFilter]
  }, [activityData, filter, pendingData])

  const filteredTxns = useMemo(() => {
    if (filter === 'payment') {
      return data.filter(
        (txn) =>
          txn.payments &&
          txn.payments.some((p) =>
            tokenType === TokenType.Hnt
              ? !p.tokenType || p.tokenType === TokenType.Hnt
              : p.tokenType === tokenType,
          ),
      )
    }

    return data.filter((txn: Activity) =>
      tokenType === TokenType.Hnt
        ? !txn.tokenType || txn.tokenType === TokenType.Hnt
        : txn.tokenType === tokenType,
    )
  }, [data, filter, tokenType])

  return {
    data: filteredTxns,
    error,
    loading: loading || loadingActivityLazy,
    requestMore,
    now,
  }
}
