import { PublicKey } from '@solana/web3.js'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTransactions,
  onLogs,
  removeAccountChangeListener,
} from '@utils/solanaUtils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSolana } from '../../solana/SolanaProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { FilterType } from './AccountActivityFilter'
import {
  FetchActivity,
  filterActivity,
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

    return () => {
      removeAccountChangeListener(anchorProvider, subId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, mintStr, anchorProvider, queryClient])

  const requestMore = useCallback(() => {
    if (hasNextPage) fetchNextPage()
  }, [hasNextPage, fetchNextPage])

  const data = useMemo(() => {
    if (!account?.solanaAddress || !pages) return []
    return filterActivity(pages.pages.flat(), {
      filter,
      mint: mintStr,
      owner: account.solanaAddress,
    })
  }, [account?.solanaAddress, pages, mintStr, filter])

  return {
    data,
    error,
    loading,
    requestMore,
    now,
  }
}
