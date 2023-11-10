/* eslint-disable @typescript-eslint/no-shadow */
import { useOrganizationProposals } from '@helium/modular-governance-hooks'
import { organizationKey } from '@helium/organization-sdk'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import {
  useRegistrar,
  getRegistrarKey,
  HeliumVsrStateProvider,
  useHeliumVsrState,
} from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react'
import { Wallet } from '@coral-xyz/anchor'
import { useSolana } from '../solana/SolanaProvider'

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
  error: unknown
  loading: boolean
  mint: PublicKey
  network: GovNetwork
  proposals: ReturnType<typeof useOrganizationProposals>['accounts']
  registrar?: ReturnType<typeof useRegistrar>['info']

  setMint: (mint: PublicKey) => void
}

const GovernanceContext = createContext<IGovernanceContextState>(
  {} as IGovernanceContextState,
)

const GovernanceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { anchorProvider } = useSolana()
  const [mint, setMint] = useState(HNT_MINT)
  const network = useMemo(() => mintsToNetwork[mint.toBase58()], [mint])
  const organization = useMemo(() => organizationKey(network)[0], [network])
  const { loading: loadingProposals, accounts: proposalsWithDups } =
    useOrganizationProposals(organization)
  const proposals = useMemo(() => {
    const seen = new Set()
    return proposalsWithDups?.filter((p) => {
      const has = seen.has(p.info?.name)
      seen.add(p.info?.name)

      return !has
    })
  }, [proposalsWithDups])

  const registrarKey = useMemo(
    () => mint && getRegistrarKey(mint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mint.toBase58()],
  )

  const { info: registrar } = useRegistrar(registrarKey)

  const error = useMemo(() => {}, [])
  const loading = useMemo(() => loadingProposals, [loadingProposals])

  const ret = useMemo(
    () => ({
      error,
      loading,
      mint,
      network,
      proposals,
      registrar,
      setMint,
    }),
    [error, loading, mint, network, proposals, registrar, setMint],
  )

  return (
    <GovernanceContext.Provider value={ret}>
      <HeliumVsrStateProvider
        mint={mint}
        wallet={anchorProvider?.wallet as Wallet}
        connection={anchorProvider?.connection}
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
  const { mint, ...heliumVsrState } = useHeliumVsrState()
  return {
    ...context,
    ...heliumVsrState,
  }
}

export { GovernanceProvider, useGovernance }
