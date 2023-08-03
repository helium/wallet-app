import { DC_MINT } from '@helium/spl-utils'
import { PublicKey } from '@solana/web3.js'
import { onLogs, removeAccountChangeListener } from '@utils/solanaUtils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useSolana } from '../../solana/SolanaProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { RootState } from '../../store/rootReducer'
import { getTxns } from '../../store/slices/solanaSlice'
import { useAppDispatch } from '../../store/store'
import { FilterType } from './AccountActivityFilter'

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
  const dispatch = useAppDispatch()
  const { anchorProvider } = useSolana()
  const solanaActivity = useSelector(
    (state: RootState) => state.solana.activity,
  )
  const accountSubscriptionId = useRef<number>()

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!account?.address || !anchorProvider) return

    dispatch(
      getTxns({
        account,
        mint: mintStr,
        requestType: 'start_fresh',
        anchorProvider,
      }),
    )

    const subId = onLogs(
      anchorProvider,
      anchorProvider.publicKey.toBase58(),
      () => {
        dispatch(
          getTxns({
            account,
            mint: mintStr,
            requestType: 'update_head',
            anchorProvider,
          }),
        )
      },
    )

    if (accountSubscriptionId.current !== undefined) {
      removeAccountChangeListener(anchorProvider, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
  }, [account, dispatch, filter, mintStr, anchorProvider])

  const requestMore = useCallback(() => {
    if (!account?.address || !anchorProvider) return

    dispatch(
      getTxns({
        account,
        mint: mintStr,
        requestType: 'fetch_more',
        anchorProvider,
      }),
    )
  }, [account, dispatch, anchorProvider, mintStr])

  const data = useMemo(() => {
    if (!account?.solanaAddress || !solanaActivity.data[account.solanaAddress])
      return []

    if (
      mintStr === DC_MINT.toBase58() &&
      (filter === 'delegate' || filter === 'mint')
    ) {
      return solanaActivity.data[account.solanaAddress][filter][mintStr]
    }

    if (filter !== 'in' && filter !== 'out' && filter !== 'all') return []
    if (filter === 'in' || filter === 'out') {
      const payments =
        solanaActivity.data[account.solanaAddress]?.payment[mintStr]
      return payments?.filter((txn) =>
        txn.payments?.some((payment) =>
          payment.mint === mintStr &&
          payment.owner === account?.solanaAddress &&
          filter === 'out'
            ? payment.amount < 0
            : payment.amount > 0,
        ),
      )
    }

    return solanaActivity.data[account.solanaAddress][filter][mintStr]
  }, [account?.solanaAddress, solanaActivity.data, mintStr, filter])

  const loading = useMemo(() => {
    return solanaActivity.loading
  }, [solanaActivity.loading])

  const error = useMemo(() => {
    return solanaActivity.error
  }, [solanaActivity.error])

  return {
    data,
    error,
    loading,
    requestMore,
    now,
  }
}
