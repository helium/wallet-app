import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { getHotspotWithRewards } from '@utils/solanaUtils'
import { useSolana } from '../solana/SolanaProvider'
import { CompressedNFT } from '../types/solana'

export const useHotspotWithMetaAndRewards = (hotspot: CompressedNFT) => {
  const { id: assetId } = hotspot
  const { anchorProvider } = useSolana()

  const {
    isLoading: loading,
    error,
    data,
  } = useQuery({
    queryKey: [
      'hotspotWithRewards',
      assetId,
      anchorProvider?.connection.rpcEndpoint,
    ],
    queryFn: async () => {
      if (!anchorProvider) return null
      return getHotspotWithRewards(new PublicKey(assetId), anchorProvider)
    },
    enabled: !!assetId && !!anchorProvider,
    staleTime: 0,
    gcTime: 0,
  })

  return {
    loading,
    error,
    hotspotWithMeta: data ?? undefined,
  }
}
