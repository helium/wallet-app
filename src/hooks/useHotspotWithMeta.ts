import { PublicKey } from '@solana/web3.js'
import { getHotspotWithRewards } from '@utils/solanaUtils'
import { useAsync } from 'react-async-hook'
import { useSolana } from '../solana/SolanaProvider'
import { CompressedNFT } from '../types/solana'

export const useHotspotWithMetaAndRewards = (hotspot: CompressedNFT) => {
  const { id: assetId } = hotspot
  const { anchorProvider } = useSolana()

  const { loading, error, result } = useAsync(async () => {
    if (!assetId || !anchorProvider) return undefined

    return getHotspotWithRewards(new PublicKey(assetId), anchorProvider)
  }, [assetId, anchorProvider])

  return {
    loading,
    error,
    hotspotWithMeta: result,
  }
}
