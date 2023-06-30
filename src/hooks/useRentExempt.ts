import { useAsync } from 'react-async-hook'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useSolana } from '../solana/SolanaProvider'
import * as logger from '../utils/logger'

export function useRentExempt(dataLength = 0) {
  const { connection } = useSolana()
  const { loading, result, error } = useAsync(async () => {
    if (connection) {
      try {
        const totalSol = await connection?.getMinimumBalanceForRentExemption(
          dataLength,
        )
        return totalSol / LAMPORTS_PER_SOL
      } catch (e) {
        logger.error(e)
      }
    }
  }, [connection, dataLength])

  return {
    loading,
    error,
    rentExempt: result,
  }
}
