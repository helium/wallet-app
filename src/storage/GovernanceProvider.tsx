import { Wallet } from '@coral-xyz/anchor'
import { useOrganization } from '@helium/modular-governance-hooks'
import { organizationKey } from '@helium/organization-sdk'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import {
  HeliumVsrStateProvider,
  SubDaoWithMeta,
  getSubDaos,
  useHeliumVsrState,
  useRegistrar,
} from '@helium/voter-stake-registry-hooks'
import { getRegistrarKey } from '@helium/voter-stake-registry-sdk'
import { PublicKey } from '@solana/web3.js'
import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import Config from 'react-native-config'
import { useSolana } from '../solana/SolanaProvider'
import { useAccountStorage } from './AccountStorageProvider'

enum GovNetwork {
  hnt = 'Helium',
  mobile = 'Helium MOBILE',
  iot = 'Helium IOT',
}

const mintsToNetwork: { [key: string]: GovNetwork } = {
  [HNT_MINT.toBase58()]: GovNetwork.hnt,
  [MOBILE_MINT.toBase58()]: GovNetwork.mobile,
  [IOT_MINT.toBase58()]: GovNetwork.iot,
}
export interface IGovernanceContextState {
  loading: boolean
  mint: PublicKey
  network: GovNetwork
  registrar?: ReturnType<typeof useRegistrar>['info']
  proposalCountByMint?: Record<string, number>
  hasUnseenProposals?: boolean
  subDaos?: SubDaoWithMeta[]
  setMint: (mint: PublicKey) => void
}

const GovernanceContext = createContext<IGovernanceContextState>(
  {} as IGovernanceContextState,
)

const GovernanceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { anchorProvider } = useSolana()
  const [mint, setMint] = useState(HNT_MINT)
  const network = useMemo(() => mintsToNetwork[mint.toBase58()], [mint])
  const registrarKey = useMemo(() => mint && getRegistrarKey(mint), [mint])
  const { info: registrar } = useRegistrar(registrarKey)
  const { upsertAccount, currentAccount } = useAccountStorage()

  const { loading: loadingHntOrg, info: hntOrg } = useOrganization(
    organizationKey(mintsToNetwork[HNT_MINT.toBase58()])[0],
  )

  const { loading: loadingMobileOrg, info: mobileOrg } = useOrganization(
    organizationKey(mintsToNetwork[MOBILE_MINT.toBase58()])[0],
  )

  const { loading: loadingIotOrg, info: iotOrg } = useOrganization(
    organizationKey(mintsToNetwork[IOT_MINT.toBase58()])[0],
  )

  const { loading: loadingSubdaos, result: subDaos } = useAsync(
    async () => anchorProvider && getSubDaos(anchorProvider),
    [anchorProvider],
  )

  const loading = useMemo(
    () => loadingHntOrg || loadingMobileOrg || loadingIotOrg || loadingSubdaos,
    [loadingHntOrg, loadingMobileOrg, loadingIotOrg, loadingSubdaos],
  )

  const proposalCountByMint = useMemo(() => {
    if (!loading)
      return {
        [HNT_MINT.toBase58()]: hntOrg?.numProposals || 0,
        [MOBILE_MINT.toBase58()]: mobileOrg?.numProposals || 0,
        [IOT_MINT.toBase58()]: iotOrg?.numProposals || 0,
      }
  }, [loading, hntOrg, mobileOrg, iotOrg])

  // If we have no record of proposals count by mint, set it to value from provider
  // In order to prevent spamming the Ui with false positives of past proposals
  // being unseen, new proposals should act properly
  useAsync(async () => {
    if (
      !loading &&
      hntOrg &&
      mobileOrg &&
      iotOrg &&
      proposalCountByMint &&
      currentAccount &&
      currentAccount.proposalCountByMint === undefined
    ) {
      await upsertAccount({
        ...currentAccount,
        proposalCountByMint,
      })
    }
  }, [loading])

  const hasUnseenProposals = useMemo(() => {
    if (
      currentAccount &&
      currentAccount.proposalCountByMint &&
      proposalCountByMint !== undefined
    ) {
      return Object.keys(currentAccount.proposalCountByMint).some(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (m) => currentAccount.proposalCountByMint![m] < proposalCountByMint[m],
      )
    }
    return false
  }, [currentAccount, proposalCountByMint])

  const ret = useMemo(
    () => ({
      loading,
      mint,
      network,
      registrar,
      proposalCountByMint,
      hasUnseenProposals: hasUnseenProposals || false,
      setMint,
      subDaos,
    }),
    [
      loading,
      mint,
      network,
      registrar,
      proposalCountByMint,
      hasUnseenProposals,
      subDaos,
    ],
  )

  return (
    <GovernanceContext.Provider value={ret}>
      <HeliumVsrStateProvider
        mint={mint}
        wallet={anchorProvider?.wallet as Wallet}
        connection={anchorProvider?.connection}
        heliumVoteUri={Config.HELIUM_VOTE_API_URL}
      >
        {children}
      </HeliumVsrStateProvider>
    </GovernanceContext.Provider>
  )
}

const useGovernance = () => {
  const context = useContext(GovernanceContext)
  if (context === undefined) {
    throw new Error('useGovernance must be used within a GovernanceProvider')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mint, positions, ...heliumVsrState } = useHeliumVsrState()

  const numActiveVotes = useMemo(
    () => positions?.reduce((acc, p) => acc + p.numActiveVotes, 0) || 0,
    [positions],
  )

  const loading = useMemo(
    () => context.loading || heliumVsrState.loading,
    [context.loading, heliumVsrState.loading],
  )

  return {
    ...context,
    ...heliumVsrState,
    numActiveVotes,
    positions,
    loading,
  }
}

export { GovernanceProvider, useGovernance }
