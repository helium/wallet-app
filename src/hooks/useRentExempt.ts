import { useQuery } from '@tanstack/react-query'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { MIN_WALLET_RENT_LAMPORTS } from '@utils/solanaUtils'
import { useSolana } from '../solana/SolanaProvider'

export function useRentExempt(dataLength = 0) {
  const { connection } = useSolana()
  // Rent params effectively never change — cache forever per endpoint/size
  // and share the result across all hook consumers.
  const { isLoading, data, error } = useQuery({
    queryKey: ['rentExempt', connection?.rpcEndpoint, dataLength],
    queryFn: () =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      connection!.getMinimumBalanceForRentExemption(dataLength),
    enabled: !!connection,
    staleTime: Infinity,
  })

  // Fall back to the known 0-data minimum while the fetch is in flight or failed
  const rentExemptLamports = data ?? MIN_WALLET_RENT_LAMPORTS
  return {
    loading: isLoading,
    error,
    rentExempt: rentExemptLamports / LAMPORTS_PER_SOL,
    rentExemptLamports,
  }
}
