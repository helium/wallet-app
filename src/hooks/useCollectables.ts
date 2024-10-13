import { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { RootState } from '../store/rootReducer'
import {
  fetchCollectables,
  WalletCollectables,
  collectables as collectablesSli,
} from '../store/slices/collectablesSlice'
import { useAppDispatch } from '../store/store'
import {
  getNFTs,
  groupNFTs,
  onLogs,
  removeAccountChangeListener,
} from '../utils/solanaUtils'
import { useSolana } from '../solana/SolanaProvider'
import { CompressedNFT } from '@types/solana'
import { WrappedConnection } from '@utils/WrappedConnection'

const useCollectables = (): WalletCollectables & {
  refresh: () => void
  fetchAllCollectablesByGroup: () => Promise<Record<string, CompressedNFT[]>>
} => {
  const { cluster, anchorProvider } = useSolana()
  const dispatch = useAppDispatch()
  const accountSubscriptionId = useRef<number>()
  const { currentAccount } = useAccountStorage()
  const collectables = useSelector((state: RootState) => state.collectables)

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return
    // Reset loading on mount
    dispatch(
      collectablesSli.actions.resetLoading({ acct: currentAccount, cluster }),
    )
  }, [cluster, currentAccount, dispatch])

  const refresh = useCallback(() => {
    if (!currentAccount?.solanaAddress || !anchorProvider) {
      return
    }
    const { connection } = anchorProvider

    dispatch(
      fetchCollectables({
        account: currentAccount,
        cluster,
        connection,
      }),
    )
  }, [cluster, currentAccount, dispatch, anchorProvider])

  useEffect(() => {
    if (!currentAccount?.solanaAddress || !anchorProvider) return

    refresh()

    const subId = onLogs(anchorProvider, currentAccount?.solanaAddress, () => {
      refresh()
    })

    if (accountSubscriptionId.current !== undefined) {
      removeAccountChangeListener(anchorProvider, accountSubscriptionId.current)
    }
    accountSubscriptionId.current = subId
  }, [anchorProvider, currentAccount, dispatch, refresh])

  const fetchAllCollectablesByGroup = useCallback(async () => {
    if (!anchorProvider) return {}

    let page = 1
    let isLastPage = false
    let fetchedCollectables: CompressedNFT[] = []

    while (!isLastPage) {
      const response = await getNFTs(
        anchorProvider?.publicKey,
        anchorProvider?.connection as WrappedConnection,
        page,
      )
      fetchedCollectables = fetchedCollectables.concat(response)
      isLastPage = response.length === 0
      page++
    }

    const groupedCollectablesWithMeta = await groupNFTs(fetchedCollectables)

    return groupedCollectablesWithMeta
  }, [anchorProvider])

  if (
    !currentAccount?.solanaAddress ||
    !collectables[cluster]?.[currentAccount?.solanaAddress]
  ) {
    return {
      loading: false,
      collectables: {},
      refresh,
      fetchAllCollectablesByGroup,
    }
  }

  return {
    ...collectables[cluster][currentAccount?.solanaAddress],
    refresh,
    fetchAllCollectablesByGroup,
  }
}
export default useCollectables
