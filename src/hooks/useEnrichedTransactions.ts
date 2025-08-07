import AsyncStorage from '@react-native-async-storage/async-storage'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSolana } from '../solana/SolanaProvider'
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
  const { cluster, anchorProvider } = useSolana()
  const [transactions, setTransactions] = useState<
    (EnrichedTransaction | ConfirmedSignatureInfo)[]
  >([])
  const [oldestTransaction, setOldestTransaction] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchingMore, setFetchingMore] = useState<boolean>(false)
  const [onEndReached, setOnEndReached] = useState<boolean>(false)
  const [hasNewTransactions, setHasNewTransactions] = useState(false)
  const accountSubscriptionId = useRef<number | undefined>(undefined)
  const firstSig = useMemo(
    () => (transactions[0] ? transactions[0].signature : ''),
    [transactions],
  )

  useEffect(() => {
    if (transactions.length > 0) {
      AsyncStorage.setItem(
        `txs-${cluster}-${currentAccount?.solanaAddress}`,
        // Limit of 50 stored tx to not blow storage limit
        JSON.stringify(transactions.slice(0, 50)),
      )
    }
  }, [transactions, cluster, currentAccount])

  // Reset new transactions when account changes. Maybe we add this all into a slice?
  useEffect(() => {
    if (currentAccount?.solanaAddress) {
      setHasNewTransactions(false)
    }
  }, [currentAccount])

  const refresh = useCallback(async () => {
    if (!currentAccount?.solanaAddress || !anchorProvider) {
      return
    }
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
  const loadTransactionsFromStorage = useCallback(async () => {
    try {
      const storageKey = `txs-${cluster}-${currentAccount?.solanaAddress}`
      const storedTransactions = await AsyncStorage.getItem(storageKey)
      if (storedTransactions && storedTransactions.length > 0) {
        const parsedTransactions = JSON.parse(storedTransactions)
        setTransactions(parsedTransactions)
        setOldestTransaction(
          parsedTransactions.length > 0
            ? parsedTransactions[parsedTransactions.length - 1].signature
            : '',
        )
      } else {
        await refresh()
      }
    } catch (error) {
      console.error('Error loading transactions from AsyncStorage:', error)
    }
  }, [refresh, cluster, currentAccount])

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

  const fetchNew = useCallback(async () => {
    if (!currentAccount?.solanaAddress || onEndReached || !anchorProvider) {
      return
    }

    const fetchTransactions = await getAllTransactions(
      currentAccount?.solanaAddress,
      anchorProvider,
      cluster,
      undefined,
      firstSig,
    )

    if (fetchTransactions.length !== 0) {
      setTransactions((t) => [...fetchTransactions, ...t])
      setOldestTransaction(
        fetchTransactions.length > 0
          ? fetchTransactions[fetchTransactions.length - 1].signature
          : '',
      )
    }
  }, [
    currentAccount?.solanaAddress,
    onEndReached,
    anchorProvider,
    cluster,
    firstSig,
  ])

  useEffect(() => {
    if (!currentAccount?.solanaAddress || !anchorProvider) {
      return
    }

    loadTransactionsFromStorage()

    const subId = onLogs(anchorProvider, currentAccount?.solanaAddress, () => {
      fetchNew()
      setHasNewTransactions(true)
    })

    if (accountSubscriptionId.current !== undefined) {
      removeAccountChangeListener(anchorProvider, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorProvider, currentAccount])

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
