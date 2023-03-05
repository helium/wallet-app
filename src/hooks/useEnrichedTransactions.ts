import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useAppStorage } from '../storage/AppStorageProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { EnrichedTransaction } from '../types/solana'
import {
  getAllTransactions,
  onLogs,
  removeAccountChangeListener,
} from '../utils/solanaUtils'

const useEnrichedTransactions = (): {
  transactions: (EnrichedTransaction | ConfirmedSignatureInfo)[]
  loading: boolean
  fetchingMore: boolean
  refresh: () => void
  fetchMore: () => void
  onEndReached: boolean
  resetNewTransactions: () => void
  hasNewTransactions: boolean
} => {
  const { currentAccount } = useAccountStorage()
  const { solanaNetwork: cluster } = useAppStorage()
  const [transactions, setTransactions] = useState<
    (EnrichedTransaction | ConfirmedSignatureInfo)[]
  >([])
  const [oldestTransaction, setOldestTransaction] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchingMore, setFetchingMore] = useState<boolean>(false)
  const [onEndReached, setOnEndReached] = useState<boolean>(false)
  const [hasNewTransactions, setHasNewTransactions] = useState(false)
  const accountSubscriptionId = useRef<number>()

  // Reset new transactions when account changes. Maybe we add this all into a slice?
  useEffect(() => {
    if (currentAccount?.solanaAddress) {
      setHasNewTransactions(false)
    }
  }, [currentAccount])

  const refresh = useCallback(async () => {
    if (!currentAccount || !currentAccount?.solanaAddress) return
    setLoading(true)
    const fetchTransactions = await getAllTransactions(
      currentAccount?.solanaAddress,
      cluster,
    )
    setTransactions(fetchTransactions)
    setOldestTransaction(
      fetchTransactions.length > 0
        ? fetchTransactions[fetchTransactions.length - 1].signature
        : '',
    )
    setLoading(false)
    setOnEndReached(false)
  }, [currentAccount, cluster])

  const fetchMore = useCallback(async () => {
    if (
      !currentAccount ||
      !currentAccount?.solanaAddress ||
      fetchingMore ||
      onEndReached
    ) {
      return
    }

    setFetchingMore(true)
    const fetchTransactions = await getAllTransactions(
      currentAccount?.solanaAddress,
      cluster,
      oldestTransaction,
    )

    if (fetchTransactions.length !== 0) {
      setTransactions((t) => [...t, ...fetchTransactions])
      setOldestTransaction(
        fetchTransactions.length > 0
          ? fetchTransactions[fetchTransactions.length - 1].signature
          : '',
      )
    } else {
      setOnEndReached(true)
    }
    setFetchingMore(false)
  }, [currentAccount, fetchingMore, onEndReached, cluster, oldestTransaction])

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return

    refresh()

    const subId = onLogs(cluster, currentAccount?.solanaAddress, () => {
      refresh()
      setHasNewTransactions(true)
    })

    if (accountSubscriptionId.current !== undefined) {
      removeAccountChangeListener(cluster, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
  }, [cluster, currentAccount, refresh])

  const resetNewTransactions = useCallback(() => {
    setHasNewTransactions(false)
  }, [])

  return {
    transactions,
    loading,
    refresh,
    fetchingMore,
    fetchMore,
    onEndReached,
    resetNewTransactions,
    hasNewTransactions,
  }
}

export default useEnrichedTransactions
