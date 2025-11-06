import { Wallet } from '@coral-xyz/anchor'
import { useMint } from '@helium/helium-react-hooks'
import { useOrganization } from '@helium/modular-governance-hooks'
import { organizationKey } from '@helium/organization-sdk'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import {
  HeliumVsrStateProvider,
  getSubDaos,
  useHeliumVsrState,
  useRegistrar,
  useSubDaos,
} from '@helium/voter-stake-registry-hooks'
import { getRegistrarKey } from '@helium/voter-stake-registry-sdk'
import { useCurrentRoute } from '@hooks/useCurrentRoute'
import { PublicKey } from '@solana/web3.js'
import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import Config from 'react-native-config'
import { useSelector } from 'react-redux'
import { useSolana } from '../solana/SolanaProvider'
import { RootState } from '../store/rootReducer'
import { useAccountStorage } from './AccountStorageProvider'

type GovNetwork = 'hnt' | 'mobile' | 'iot'
type NetworkToName = { [K in GovNetwork]: string }
type NetworkToMint = { [K in GovNetwork]: PublicKey }
type MintToNetwork = { [key: string]: GovNetwork }
const networkToName: NetworkToName = {
  hnt: 'Helium',
  mobile: 'Helium MOBILE',
  iot: 'Helium IOT',
}

const networksToMint: NetworkToMint = {
  hnt: HNT_MINT,
  mobile: MOBILE_MINT,
  iot: IOT_MINT,
}

const mintsToNetwork: MintToNetwork = {
  [HNT_MINT.toBase58()]: 'hnt',
  [MOBILE_MINT.toBase58()]: 'mobile',
  [IOT_MINT.toBase58()]: 'iot',
}

export interface IGovernanceContextState {
  loading: boolean
  mint: PublicKey
  network: GovNetwork
  networkName: string
  organization: PublicKey
  registrar?: ReturnType<typeof useRegistrar>['info']
  mintAcc?: ReturnType<typeof useMint>['info']
  subDaos?: ReturnType<typeof useSubDaos>['result']
  proposalCountByMint?: Record<string, number>
  hasUnseenProposals?: boolean
}

const GovernanceContext = createContext<IGovernanceContextState>(
  {} as IGovernanceContextState,
)

const GovernanceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { anchorProvider } = useSolana()
  const { upsertAccount, currentAccount } = useAccountStorage()
  const currentRoute = useCurrentRoute()
  const { params }: { params?: { mint?: string } } = currentRoute || {}
  const network: GovNetwork = params?.mint
    ? (mintsToNetwork[params.mint] as GovNetwork) || 'hnt'
    : 'hnt'
  const networkName = useMemo(() => networkToName[network], [network])
  const mint = useMemo(() => networksToMint[network], [network])
  const registrarKey = useMemo(() => mint && getRegistrarKey(mint), [mint])
  // Batch all governance data fetching to reduce RPC calls
  const { loading: loadingGovernanceData, result: governanceData } =
    useAsync(async () => {
      if (!anchorProvider || !mint || !registrarKey) return undefined

      const { connection } = anchorProvider
      const organizationKeys = [
        organizationKey(networkToName.hnt)[0],
        organizationKey(networkToName.mobile)[0],
        organizationKey(networkToName.iot)[0],
      ]

      try {
        // Batch all account fetches in parallel
        const [
          mintAccount,
          registrarAccount,
          subDaosResult,
          ...organizationAccounts
        ] = await Promise.all([
          connection.getAccountInfo(mint),
          connection.getAccountInfo(registrarKey),
          getSubDaos(anchorProvider),
          ...organizationKeys.map((key) => connection.getAccountInfo(key)),
        ])

        return {
          mintAccount,
          registrarAccount,
          subDaos: subDaosResult,
          hntOrgAccount: organizationAccounts[0],
          mobileOrgAccount: organizationAccounts[1],
          iotOrgAccount: organizationAccounts[2],
        }
      } catch (error) {
        console.error('[GovernanceProvider] Batch fetch error:', error)
        return undefined
      }
    }, [anchorProvider, mint, registrarKey])

  // Fallback to individual hooks for parsing (these won't make additional RPC calls if data exists)
  const { loading: loadingMint, info: mintAcc } = useMint(
    !governanceData ? mint : undefined,
  )
  const { loading: loadingRegistrar, info: registrar } = useRegistrar(
    !governanceData ? registrarKey : undefined,
  )

  const organization = useMemo(
    () => organizationKey(networkName)[0],
    [networkName],
  )

  const { loading: loadingSubdaos, result: subDaos } = useAsync(async () => {
    if (governanceData?.subDaos) return governanceData.subDaos
    if (!anchorProvider || governanceData !== undefined) return undefined
    return getSubDaos(anchorProvider)
  }, [anchorProvider, governanceData])

  const { loading: loadingHntOrg, info: hntOrg } = useOrganization(
    !governanceData ? organizationKey(networkToName.hnt)[0] : undefined,
  )

  const { loading: loadingMobileOrg, info: mobileOrg } = useOrganization(
    !governanceData ? organizationKey(networkToName.mobile)[0] : undefined,
  )

  const { loading: loadingIotOrg, info: iotOrg } = useOrganization(
    !governanceData ? organizationKey(networkToName.iot)[0] : undefined,
  )

  const loadingOrgs = useMemo(
    () => loadingHntOrg || loadingMobileOrg || loadingIotOrg,
    [loadingHntOrg, loadingMobileOrg, loadingIotOrg],
  )

  const loading = useMemo(
    () =>
      loadingGovernanceData ||
      loadingRegistrar ||
      loadingMint ||
      loadingSubdaos ||
      loadingOrgs,
    [
      loadingGovernanceData,
      loadingRegistrar,
      loadingMint,
      loadingSubdaos,
      loadingOrgs,
    ],
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
      network,
      networkName,
      mint,
      mintAcc,
      organization,
      registrar,
      subDaos,
      proposalCountByMint,
      hasUnseenProposals: hasUnseenProposals || false,
    }),
    [
      loading,
      network,
      networkName,
      mint,
      mintAcc,
      organization,
      registrar,
      subDaos,
      proposalCountByMint,
      hasUnseenProposals,
    ],
  )

  const cluster = useSelector(
    (state: RootState) => state.app.cluster || 'mainnet-beta',
  )

  const heliumVoteUri = useMemo(() => {
    if (cluster === 'mainnet-beta') {
      return Config.HELIUM_VOTE_API_URL
    }

    return Config.DEVNET_HELIUM_VOTE_API_URL
  }, [cluster])

  return (
    <GovernanceContext.Provider value={ret}>
      <HeliumVsrStateProvider
        mint={mint}
        wallet={anchorProvider?.wallet as Wallet}
        connection={anchorProvider?.connection}
        heliumVoteUri={heliumVoteUri}
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
