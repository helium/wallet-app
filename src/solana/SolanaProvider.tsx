import { AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { AccountFetchCache } from '@helium/account-fetch-cache'
import { init as initDc } from '@helium/data-credits-sdk'
import { init as initHem } from '@helium/helium-entity-manager-sdk'
import { init as initHsd } from '@helium/helium-sub-daos-sdk'
import { init as initLazy } from '@helium/lazy-distributor-sdk'
import { DC_MINT, HNT_MINT } from '@helium/spl-utils'
import {
  AccountInfo,
  Cluster,
  Commitment,
  PublicKey,
  RpcResponseAndContext,
  Transaction,
} from '@solana/web3.js'
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import Config from 'react-native-config'
import { useSelector } from 'react-redux'
import OnboardingClient, { SolanaOnboarding } from '@helium/onboarding'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { getSessionKey, getSolanaKeypair } from '../storage/secureStorage'
import { RootState } from '../store/rootReducer'
import { appSlice } from '../store/slices/appSlice'
import { useAppDispatch } from '../store/store'
import { DcProgram, HemProgram, HsdProgram, LazyProgram } from '../types/solana'
import { getConnection } from '../utils/solanaUtils'

const useSolanaHook = () => {
  const { currentAccount } = useAccountStorage()
  const dispatch = useAppDispatch()
  const cluster = useSelector(
    (state: RootState) => state.app.cluster || 'mainnet-beta',
  )
  const [dcProgram, setDcProgram] = useState<DcProgram>()
  const [hemProgram, setHemProgram] = useState<HemProgram>()
  const [hsdProgram, setHsdProgram] = useState<HsdProgram>()
  const [lazyProgram, setLazyProgram] = useState<LazyProgram>()
  const { loading, result: sessionKey } = useAsync(getSessionKey, [])
  const connection = useMemo(() => {
    const sessionKeyActual =
      !loading && !sessionKey ? Config.RPC_SESSION_KEY_FALLBACK : sessionKey

    if (sessionKeyActual) {
      return getConnection(cluster, sessionKeyActual)
    }
  }, [cluster, sessionKey, loading])

  const address = useMemo(
    () => currentAccount?.address,
    [currentAccount?.address],
  )

  const solanaOnboarding = useMemo(() => {
    if (!address || !connection) return

    const onboardingClient = new OnboardingClient(
      cluster === 'devnet'
        ? Config.ONBOARDING_API_TEST_URL
        : Config.ONBOARDING_API_URL,
    )

    return new SolanaOnboarding({
      onboardingClient,
      connection,
      heliumWalletAddress: address,
      cluster,
    })
  }, [address, connection, cluster])

  const { result: secureAcct } = useAsync(
    async (addr: string | undefined) => {
      if (addr) {
        return getSolanaKeypair(addr)
      }
    },
    [address],
  )

  const anchorProvider = useMemo(() => {
    if (!secureAcct || !connection) return

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
    return new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: 'confirmed',
      commitment: 'confirmed',
    })
  }, [connection, secureAcct])

  const cache = useMemo(() => {
    if (!connection) return

    const c = new AccountFetchCache({
      connection,
      delay: 100,
      commitment: 'confirmed',
      missingRefetchDelay: 60 * 1000,
      extendConnection: true,
    })
    const oldGetAccountinfoAndContext =
      connection.getAccountInfoAndContext.bind(connection)

    // Anchor uses this call on .fetch and .fetchNullable even though it doesn't actually need the context. Add caching.
    connection.getAccountInfoAndContext = async (
      publicKey: PublicKey,
      com?: Commitment,
    ): Promise<RpcResponseAndContext<AccountInfo<Buffer> | null>> => {
      if (
        (com || connection.commitment) === 'confirmed' ||
        typeof (com || connection.commitment) === 'undefined'
      ) {
        const [result, dispose] = await c.searchAndWatch(publicKey)
        setTimeout(dispose, 30 * 1000) // cache for 30s
        return {
          value: result?.account || null,
          context: {
            slot: 0,
          },
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return oldGetAccountinfoAndContext!(publicKey, com)
    }

    return c
  }, [connection])
  useEffect(() => {
    // Don't sub to hnt or dc they change a bunch
    cache?.statics.add(HNT_MINT.toBase58())
    cache?.statics.add(DC_MINT.toBase58())

    return () => cache?.close()
  }, [cache])

  const handleConnectionChanged = useCallback(async () => {
    if (!anchorProvider) return

    initHem(anchorProvider).then(setHemProgram)
    initHsd(anchorProvider).then(setHsdProgram)
    initDc(anchorProvider).then(setDcProgram)
    initLazy(anchorProvider).then(setLazyProgram)
  }, [anchorProvider])

  useEffect(() => {
    handleConnectionChanged()
  }, [cluster, address, handleConnectionChanged])

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
    cache,
    solanaOnboarding,
  }
}

const SolanaContext = createContext<ReturnType<typeof useSolanaHook> | null>(
  null,
)
const { Provider } = SolanaContext

const SolanaProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useSolanaHook()}>{children}</Provider>
}

export const useSolana = (): SolanaManager => {
  const context = useContext(SolanaContext)
  if (!context) {
    throw new Error(
      'useSolanaOnboarding has to be used within <SolanaOnboardingProvider>',
    )
  }
  return context
}
export default SolanaProvider

export type SolanaManager = ReturnType<typeof useSolanaHook>
