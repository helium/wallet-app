import type { Position } from '@helium/blockchain-api'
import { useBlockchainApi } from '@storage/BlockchainApiProvider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useCurrentWallet } from './useCurrentWallet'

export type PositionDelegation = NonNullable<Position['delegation']>

const delegationsQueryKey = (wallet?: string) => ['positionDelegations', wallet]

// Delegation claim state comes from blockchain-api rather than being derived
// locally, so the app agrees with what claimDelegationRewards and
// undelegatePosition will actually build (issuance-gated, capped at the
// current epoch).
export const usePositionDelegations = () => {
  const client = useBlockchainApi()
  const wallet = useCurrentWallet()?.toBase58()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: delegationsQueryKey(wallet),
    queryFn: async () => {
      if (!wallet) throw new Error('Wallet not connected')
      return client.governance.getPositions({ wallet })
    },
    enabled: !!wallet,
    staleTime: 30000,
  })

  const delegations = useMemo(() => {
    const byMint: Record<string, PositionDelegation> = {}
    data?.forEach((p) => {
      if (p.delegation) byMint[p.positionMint] = p.delegation
    })
    return byMint
  }, [data])

  const refetch = useCallback(
    () =>
      queryClient.invalidateQueries({ queryKey: delegationsQueryKey(wallet) }),
    [queryClient, wallet],
  )

  return { delegations, loading: isLoading, refetch }
}
