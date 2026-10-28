import { DC_MINT } from '@helium/spl-utils'
import { PublicKey } from '@solana/web3.js'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTransactions,
  onLogs,
  removeAccountChangeListener,
} from '@utils/solanaUtils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSolana } from '../../solana/SolanaProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { FilterType } from './AccountActivityFilter'
import {
  FetchActivity,
  solanaActivityQuery,
  updateActivityHead,
} from './logic/solanaActivity'

export default ({
  account,
  filter,
  mint,
}: {
  account?: CSAccount | null
  filter: FilterType
  mint: PublicKey
}) => {
  const mintStr = mint.toBase58()
  const [now, setNow] = useState(new Date())
  const queryClient = useQueryClient()
  const { anchorProvider } = useSolana()
  const address = account?.solanaAddress
  const fetchActivity: FetchActivity = (options) => {
    if (!anchorProvider || !address) throw new Error('No solana account found')
    return getTransactions(anchorProvider, address, mintStr, options)
  }
  const query = solanaActivityQuery({ address, mint: mintStr, fetchActivity })
  const {
    data: pages,
    error,
    isFetching: loading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    ...query,
    enabled: !!address && !!anchorProvider,
  })
  const accountSubscriptionId = useRef<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!account?.address || !anchorProvider) return

    const subId = onLogs(
      anchorProvider,
      anchorProvider.publicKey.toBase58(),
      () => {
        updateActivityHead(queryClient, query, fetchActivity).catch(() => {
          // getTransactions logs the error; the list keeps what it has
        })
      },
    )

    if (accountSubscriptionId.current !== null) {
      removeAccountChangeListener(anchorProvider, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, mintStr, anchorProvider, queryClient])

  const requestMore = useCallback(() => {
    if (hasNextPage) fetchNextPage()
  }, [hasNextPage, fetchNextPage])

  const data = useMemo(() => {
    if (!account?.solanaAddress || !pages) return []
    const activity = pages.pages.flat()

    if (
      mintStr === DC_MINT.toBase58() &&
      (filter === 'delegate' || filter === 'mint')
    ) {
      return activity
    }

    if (filter !== 'in' && filter !== 'out' && filter !== 'all') return []
    if (filter === 'in' || filter === 'out') {
      return activity.filter((txn) =>
        txn.payments?.some((payment) =>
          payment.mint === mintStr &&
          payment.owner === account?.solanaAddress &&
          filter === 'out'
            ? payment.amount < 0
            : payment.amount > 0,
        ),
      )
    }

    return activity
  }, [account?.solanaAddress, pages, mintStr, filter])

  return {
    data,
    error,
    loading,
    requestMore,
    now,
  }
}
