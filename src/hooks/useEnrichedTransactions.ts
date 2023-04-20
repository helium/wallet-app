import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { EnrichedTransaction } from '../types/solana'
import {
  getAllTransactions,
  onLogs,
  removeAccountChangeListener,
} from '../utils/solanaUtils'
import { useAppDispatch } from '../store/store'
import { readBalances } from '../store/slices/solanaSlice'
import { useSolana } from '../solana/SolanaProvider'

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
  const { cluster, anchorProvider } = useSolana()
  const [transactions, setTransactions] = useState<
    (EnrichedTransaction | ConfirmedSignatureInfo)[]
  >([])
  const [oldestTransaction, setOldestTransaction] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchingMore, setFetchingMore] = useState<boolean>(false)
  const [onEndReached, setOnEndReached] = useState<boolean>(false)
  const [hasNewTransactions, setHasNewTransactions] = useState(false)
  const accountSubscriptionId = useRef<number>()
  const dispatch = useAppDispatch()

  // Reset new transactions when account changes. Maybe we add this all into a slice?
  useEffect(() => {
    if (currentAccount?.solanaAddress) {
      setHasNewTransactions(false)
    }
  }, [currentAccount])

  const refresh = useCallback(async () => {
    if (!currentAccount?.solanaAddress || !anchorProvider) return
    setLoading(true)
    const fetchTransactions = await getAllTransactions(
      currentAccount?.solanaAddress,
      anchorProvider,
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
  }, [currentAccount, cluster, anchorProvider])

  const fetchMore = useCallback(async () => {
    if (
      !currentAccount?.solanaAddress ||
      fetchingMore ||
      onEndReached ||
      !anchorProvider
    ) {
      return
    }

    setFetchingMore(true)
    const fetchTransactions = await getAllTransactions(
      currentAccount?.solanaAddress,
      anchorProvider,
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
  }, [
    currentAccount,
    fetchingMore,
    onEndReached,
    cluster,
    oldestTransaction,
    anchorProvider,
  ])

  useEffect(() => {
    if (!currentAccount?.solanaAddress || !anchorProvider) return

    refresh()

    const subId = onLogs(anchorProvider, currentAccount?.solanaAddress, () => {
      refresh()
      dispatch(readBalances({ anchorProvider, acct: currentAccount }))
      setHasNewTransactions(true)
    })

    if (accountSubscriptionId.current !== undefined) {
      removeAccountChangeListener(anchorProvider, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
  }, [anchorProvider, currentAccount, refresh, dispatch])

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
