import React, {
  createContext,
  ReactNode,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { heliumAddressToSolPublicKey } from '@helium/spl-utils'
import { init as initHsd } from '@helium/helium-sub-daos-sdk'
import { init as initDc } from '@helium/data-credits-sdk'
import { init as initHem } from '@helium/helium-entity-manager-sdk'
import { AnchorProvider, Wallet, Program } from '@coral-xyz/anchor'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { HeliumSubDaos } from '@helium/idls/lib/types/helium_sub_daos'
import { DataCredits } from '@helium/idls/lib/types/data_credits'
import Config from 'react-native-config'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-async-hook'
import { Cluster } from '@solana/web3.js'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { getSessionKey } from '../storage/secureStorage'
import { getConnection } from '../utils/solanaUtils'
import { RootState } from '../store/rootReducer'
import { appSlice } from '../store/slices/appSlice'
import { useAppDispatch } from '../store/store'

const useSolanaHook = () => {
  const { currentAccount } = useAccountStorage()
  const dispatch = useAppDispatch()
  const cluster = useSelector(
    (state: RootState) => state.app.cluster || 'mainnet-beta',
  )

  const { result: connection } = useAsync(async () => {
    if (!cluster) return

    const sessionKey =
      (await getSessionKey()) || Config.RPC_SESSION_KEY_FALLBACK
    return getConnection(cluster, sessionKey)
  }, [cluster])

  const [dcProgram, setDcProgram] = useState<Program<DataCredits>>()
  const [hemProgram, setHemProgram] = useState<Program<HeliumEntityManager>>()
  const [hsdProgram, setHsdProgram] = useState<Program<HeliumSubDaos>>()
  const [provider, setProvider] = useState<AnchorProvider>()

  useEffect(() => {
    if (!currentAccount || !connection) return

    const wallet =
      currentAccount.solanaAddress ||
      heliumAddressToSolPublicKey(currentAccount.address)

    const anchorWallet = {
      get publicKey() {
        return wallet
      },
    } as Wallet

    const nextProvider = new AnchorProvider(connection, anchorWallet, {
      preflightCommitment: 'confirmed',
    })

    setProvider(nextProvider)
    initHem(nextProvider).then(setHemProgram)
    initHsd(nextProvider).then(setHsdProgram)
    initDc(nextProvider).then(setDcProgram)
  }, [connection, currentAccount])

  const updateCluster = useCallback(
    (nextCluster: Cluster) => {
      dispatch(appSlice.actions.setCluster(nextCluster))
    },
    [dispatch],
  )

  return {
    connection,
    dcProgram,
    hemProgram,
    hsdProgram,
    provider,
    updateCluster,
  }
}

const initialState = {
  connection: undefined,
  dcProgram: undefined,
  hemProgram: undefined,
  hsdProgram: undefined,
  provider: undefined,
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
