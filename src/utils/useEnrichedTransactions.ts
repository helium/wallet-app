import { useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useAppStorage } from '../storage/AppStorageProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { EnrichedTransaction } from '../types/solana'
import { getAllTransactions } from './solanaUtils'

const useEnrichedTransactions = (): {
  transactions: (EnrichedTransaction | ConfirmedSignatureInfo)[]
  loading: boolean
  fetchingMore: boolean
  refresh: () => void
  fetchMore: () => void
  onEndReached: boolean
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

  const refresh = useCallback(async () => {
    if (!currentAccount || !currentAccount?.solanaAddress) return
    setLoading(true)
    const fetchTransactions = await getAllTransactions(
      currentAccount?.solanaAddress,
      cluster,
    )
    setTransactions(fetchTransactions)
    setOldestTransaction(
      fetchTransactions[fetchTransactions.length - 1].signature,
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
        fetchTransactions[fetchTransactions.length - 1].signature,
      )
    } else {
      setOnEndReached(true)
    }
    setFetchingMore(false)
  }, [currentAccount, fetchingMore, onEndReached, cluster, oldestTransaction])

  useAsync(async () => {
    refresh()
  }, [])

  return {
    transactions,
    loading,
    refresh,
    fetchingMore,
    fetchMore,
    onEndReached,
  }
}

export default useEnrichedTransactions
