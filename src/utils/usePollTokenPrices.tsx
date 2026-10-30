import { useQuery } from '@tanstack/react-query'
import { useAppStorage } from '../storage/AppStorageProvider'
import { useAuthStore } from '../store/authStore'
import { tokenPricesQueryOptions } from './balances'

export const usePollTokenPrices = () => {
  const { currency } = useAppStorage()
  const apiToken = useAuthStore((state) => state.apiToken)

  const { data: tokenPrices } = useQuery({
    ...tokenPricesQueryOptions(currency?.toLowerCase() || ''),
    enabled: !!currency && !!apiToken,
    refetchInterval: 60000, // Every 1 min
  })

  return { tokenPrices }
}
