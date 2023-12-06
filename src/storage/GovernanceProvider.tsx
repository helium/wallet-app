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
  mint: PublicKey
  network: GovNetwork
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
  const registrarKey = useMemo(
    () => mint && getRegistrarKey(mint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mint.toBase58()],
  )

  const { info: registrar } = useRegistrar(registrarKey)

  const ret = useMemo(
    () => ({
      mint,
      network,
      registrar,
      setMint,
    }),
    [mint, network, registrar, setMint],
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
    loading: heliumVsrState.loading,
  }
}

export { GovernanceProvider, useGovernance }
