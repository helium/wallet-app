import React, {
  createContext,
  ReactNode,
  useContext,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react'
import { init as initHsd } from '@helium/helium-sub-daos-sdk'
import { init as initDc } from '@helium/data-credits-sdk'
import { init as initHem } from '@helium/helium-entity-manager-sdk'
import { init as initLazy } from '@helium/lazy-distributor-sdk'
import { AnchorProvider, Wallet } from '@coral-xyz/anchor'
import Config from 'react-native-config'
import { useSelector } from 'react-redux'
import { Cluster, Transaction } from '@solana/web3.js'
import { AccountFetchCache } from '@helium/spl-utils'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { getSessionKey, getSolanaKeypair } from '../storage/secureStorage'
import { getConnection } from '../utils/solanaUtils'
import { RootState } from '../store/rootReducer'
import { appSlice } from '../store/slices/appSlice'
import { useAppDispatch } from '../store/store'
import usePrevious from '../hooks/usePrevious'
import { WrappedConnection } from '../utils/WrappedConnection'
import { DcProgram, HemProgram, HsdProgram, LazyProgram } from '../types/solana'

const useSolanaHook = () => {
  const { currentAccount } = useAccountStorage()
  const dispatch = useAppDispatch()
  const cluster = useSelector(
    (state: RootState) => state.app.cluster || 'mainnet-beta',
  )
  const [connection, setConnection] = useState<WrappedConnection>()
  const [dcProgram, setDcProgram] = useState<DcProgram>()
  const [hemProgram, setHemProgram] = useState<HemProgram>()
  const [hsdProgram, setHsdProgram] = useState<HsdProgram>()
  const [lazyProgram, setLazyProgram] = useState<LazyProgram>()
  const [anchorProvider, setAnchorProvider] = useState<AnchorProvider>()
  const [cache, setCache] = useState<AccountFetchCache>()

  const initialized = useRef(false)
  const prevAddress = usePrevious(currentAccount?.address)
  const prevCluster = usePrevious(cluster)

  const handleConnectionChanged = useCallback(async () => {
    if (!cluster) return

    const sessionKey =
      (await getSessionKey()) || Config.RPC_SESSION_KEY_FALLBACK
    const nextConn = getConnection(cluster, sessionKey)

    if (!currentAccount?.address) {
      setConnection(nextConn)
      return
    }

    if (
      initialized.current &&
      prevAddress === currentAccount.address &&
      prevCluster === cluster
    ) {
      return
    }

    initialized.current = true

    if (
      nextConn.baseURL === connection?.baseURL &&
      prevAddress === currentAccount.address
    )
      return

    setConnection(nextConn)

    const secureAcct = await getSolanaKeypair(currentAccount.address)
    if (!secureAcct) return

    const anchorWallet = {
      signTransaction: async (transaction: Transaction) => {
        transaction.partialSign(secureAcct)
        return transaction
      },
      signAllTransactions: async (transactions: Transaction[]) => {
        return transactions.map((tx) => {
          tx.partialSign(secureAcct)
          return tx
        })
      },
      get publicKey() {
        return secureAcct?.publicKey
      },
    } as Wallet

    const nextProvider = new AnchorProvider(nextConn, anchorWallet, {
      preflightCommitment: 'confirmed',
    })

    setAnchorProvider(nextProvider)
    initHem(nextProvider).then(setHemProgram)
    initHsd(nextProvider).then(setHsdProgram)
    initDc(nextProvider).then(setDcProgram)
    initLazy(nextProvider).then(setLazyProgram)

    cache?.close()
    setCache(
      new AccountFetchCache({
        connection: nextConn,
        delay: 100,
        commitment: 'confirmed',
        missingRefetchDelay: 60 * 1000,
        extendConnection: true,
      }),
    )
  }, [
    cache,
    cluster,
    connection?.baseURL,
    currentAccount,
    prevAddress,
    prevCluster,
  ])

  useEffect(() => {
    handleConnectionChanged()
  }, [cluster, currentAccount, handleConnectionChanged])

  const updateCluster = useCallback(
    (nextCluster: Cluster) => {
      dispatch(appSlice.actions.setCluster(nextCluster))
    },
    [dispatch],
  )

  return {
    anchorProvider,
    cluster,
    connection,
    dcProgram,
    hemProgram,
    hsdProgram,
    lazyProgram,
    updateCluster,
  }
}

const initialState = {
  anchorProvider: undefined,
  cluster: 'mainnet-beta' as Cluster,
  connection: undefined,
  dcProgram: undefined,
  hemProgram: undefined,
  hsdProgram: undefined,
  lazyProgram: undefined,
  updateCluster: (_nextCluster: Cluster) => {},
}
const SolanaContext =
  createContext<ReturnType<typeof useSolanaHook>>(initialState)
const { Provider } = SolanaContext

const SolanaProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useSolanaHook()}>{children}</Provider>
}

export const useSolana = (): SolanaManager => useContext(SolanaContext)

export default SolanaProvider

export type SolanaManager = ReturnType<typeof useSolanaHook>
