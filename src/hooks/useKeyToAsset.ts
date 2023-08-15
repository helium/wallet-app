import { keyToAssetForAsset } from '@helium/helium-entity-manager-sdk'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { DAO_KEY } from '@utils/constants'
import { toAsset } from '@utils/solanaUtils'
import { CompressedNFT, HotspotWithPendingRewards } from '../types/solana'

const type = 'keyToAssetV0'
export const useKeyToAsset = (hotspot: HotspotWithPendingRewards) => {
  const keyToAssetKey = keyToAssetForAsset(
    toAsset(hotspot as CompressedNFT),
    DAO_KEY,
  )

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<HeliumEntityManager, type>(keyToAssetKey, type)
}
