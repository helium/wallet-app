import { useQuery } from '@tanstack/react-query'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useSolana } from '../solana/SolanaProvider'
import * as logger from '../utils/logger'

// Rent-exempt minimum per Solana's rent params: (128-byte account overhead +
// data) × 3480 lamports/byte-year × 2 years. Used while the live value is
// loading or the RPC failed; the blockchain-api requires the wallet to keep
// this much SOL after a transfer.
const rentExemptFallbackLamports = (dataLength: number) =>
  (128 + dataLength) * 3480 * 2

export function useRentExempt(dataLength = 0) {
  const { connection } = useSolana()
  // Rent params effectively never change — cache forever per endpoint/size
  // and share the result across all hook consumers.
  const { isLoading, data, error } = useQuery({
    queryKey: ['rentExempt', connection?.rpcEndpoint, dataLength],
    queryFn: async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return await connection!.getMinimumBalanceForRentExemption(dataLength)
      } catch (e) {
        logger.error(e)
        throw e
      }
    },
    enabled: !!connection,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  // Fall back to the formula while the fetch is in flight or failed
  const rentExemptLamports = data ?? rentExemptFallbackLamports(dataLength)
  return {
    loading: isLoading,
    error,
    rentExempt: rentExemptLamports / LAMPORTS_PER_SOL,
    rentExemptLamports,
  }
}
