/* eslint-disable @typescript-eslint/no-shadow */
import { EPOCH_LENGTH, delegatedPositionKey } from '@helium/helium-sub-daos-sdk'
import { useOrganizationProposals } from '@helium/modular-governance-hooks'
import { organizationKey } from '@helium/organization-sdk'
import { HNT_MINT, IOT_MINT, MOBILE_MINT, truthy } from '@helium/spl-utils'
import {
  PositionWithMeta,
  calcPositionVotingPower,
  getPositionKeys,
  useDelegatedPositions,
  usePositions,
  useRegistrar,
  getRegistrarKey,
} from '@helium/voter-stake-registry-hooks'
import { GetPositionsArgs as GetPosArgs } from '@helium/voter-stake-registry-hooks/lib/types/src/utils/getPositionKeys'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React, {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import { useSolanaUnixNow } from '@hooks/useSolanaUnixNow'
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
  amountLocked?: BN
  error: unknown
  loading: boolean
  mint: PublicKey
  network: GovNetwork
  positions?: PositionWithMeta[]
  proposals: ReturnType<typeof useOrganizationProposals>['accounts']
  votingPower?: BN
  registrar?: ReturnType<typeof useRegistrar>['info']

  refetch: () => void
  setMint: (mint: PublicKey) => void
}

const GovernanceContext = createContext<IGovernanceContextState>(
  {} as IGovernanceContextState,
)

const GovernanceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const wallet = useCurrentWallet()
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

  /// Allow refetching all NFTs by incrementing call index
  const [callIndex, setCallIndex] = useState(0)
  const refetch = useCallback(() => setCallIndex((i) => i + 1), [setCallIndex])
  const getPosArgs = useMemo(
    () =>
      wallet &&
      mint &&
      anchorProvider &&
      ({ wallet, mint, provider: anchorProvider, callIndex } as GetPosArgs),
    [wallet, mint, anchorProvider, callIndex],
  )

  const registrarKey = useMemo(
    () => mint && getRegistrarKey(mint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mint.toBase58()],
  )
  const { info: registrar } = useRegistrar(registrarKey)
  const { result, loading, error } = useAsync(
    async (args: GetPosArgs | undefined) => {
      if (args) {
        return getPositionKeys(args)
      }
    },
    [getPosArgs],
  )

  const delegatedPositionKeys = useMemo(() => {
    return result?.positionKeys.map((pk) => delegatedPositionKey(pk)[0])
  }, [result?.positionKeys])

  const { accounts: delegatedAccounts, loading: loadingDel } =
    useDelegatedPositions(delegatedPositionKeys)

  const { accounts: positions, loading: loadingPositions } = usePositions(
    result?.positionKeys,
  )

  const now = useSolanaUnixNow(60 * 5 * 1000)
  const { amountLocked, votingPower, positionsWithMeta } = useMemo(() => {
    if (positions && registrar && delegatedAccounts && now) {
      let amountLocked = new BN(0)
      let votingPower = new BN(0)
      const mintCfgs = registrar?.votingMints
      const positionsWithMeta = positions
        .map((position, idx) => {
          if (!position || !position.info) return undefined
          const isDelegated = !!delegatedAccounts?.[idx]?.info
          const delegatedSubDao = isDelegated
            ? delegatedAccounts[idx]?.info?.subDao
            : null
          const hasRewards = isDelegated
            ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              delegatedAccounts[idx]!.info!.lastClaimedEpoch.add(new BN(1)).lt(
                new BN(now).div(new BN(EPOCH_LENGTH)),
              )
            : false

          const posVotingPower = calcPositionVotingPower({
            position: position?.info || null,
            registrar,
            unixNow: new BN(now),
          })

          amountLocked = amountLocked.add(position.info.amountDepositedNative)
          votingPower = votingPower.add(posVotingPower)

          return {
            ...position.info,
            pubkey: position?.publicKey,
            isDelegated,
            delegatedSubDao,
            hasRewards,
            hasGenesisMultiplier: position.info.genesisEnd.gt(new BN(now)),
            votingPower: posVotingPower,
            votingMint: mintCfgs[position.info.votingMintConfigIdx],
          } as PositionWithMeta
        })
        .filter(truthy)

      return {
        positionsWithMeta,
        amountLocked,
        votingPower,
      }
    }

    return {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, registrar, delegatedAccounts, now])

  const ret = useMemo(
    () => ({
      amountLocked,
      error,
      loading: loading || loadingProposals || loadingPositions || loadingDel,
      mint,
      network,
      positions: positionsWithMeta,
      proposals,
      refetch,
      registrar,
      setMint,
      votingPower,
    }),
    [
      amountLocked,
      error,
      loading,
      loadingDel,
      loadingPositions,
      loadingProposals,
      mint,
      network,
      positionsWithMeta,
      proposals,
      refetch,
      registrar,
      setMint,
      votingPower,
    ],
  )

  return (
    <GovernanceContext.Provider value={ret}>
      {children}
    </GovernanceContext.Provider>
  )
}

const useGovernance = () => {
  const context = useContext(GovernanceContext)
  if (context === undefined) {
    throw new Error('useGovernance must be used within a GovernanceProvider')
  }
  return context
}

export { GovernanceProvider, useGovernance }
