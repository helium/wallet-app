import { keyToAssetForAsset } from '@helium/helium-entity-manager-sdk'
import { DAO_KEY } from '@utils/constants'
import { toAsset } from '@utils/solanaUtils'
import { CompressedNFT } from '../types/solana'
import { useKeyToAsset } from './useKeyToAsset'

export const useKeyToAssetForHotspot = (hotspot: CompressedNFT | undefined) => {
  const keyToAssetKey =
    hotspot && keyToAssetForAsset(toAsset(hotspot as CompressedNFT), DAO_KEY)

  return useKeyToAsset(keyToAssetKey?.toBase58())
}
