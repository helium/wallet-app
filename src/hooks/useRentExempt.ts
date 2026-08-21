import { useAsync } from 'react-async-hook'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { MIN_WALLET_RENT_LAMPORTS } from '@utils/solanaUtils'
import { useSolana } from '../solana/SolanaProvider'
import * as logger from '../utils/logger'

// Rent params effectively never change — fetch once per endpoint/size and
// share the result across all hook consumers.
const rentCache = new Map<string, Promise<number>>()

export function useRentExempt(dataLength = 0) {
  const { connection } = useSolana()
  const { loading, result, error } = useAsync(async () => {
    if (!connection) return undefined
    const key = `${connection.rpcEndpoint}-${dataLength}`
    if (!rentCache.has(key)) {
      rentCache.set(
        key,
        connection.getMinimumBalanceForRentExemption(dataLength),
      )
    }
    try {
      return await rentCache.get(key)
    } catch (e) {
      rentCache.delete(key)
      logger.error(e)
    }
  }, [connection, dataLength])

  // Fall back to the known 0-data minimum while the fetch is in flight or failed
  const rentExemptLamports = result ?? MIN_WALLET_RENT_LAMPORTS
  return {
    loading,
    error,
    rentExempt: rentExemptLamports / LAMPORTS_PER_SOL,
    rentExemptLamports,
  }
}
