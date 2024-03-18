import { decodeEntityKey } from '@helium/helium-entity-manager-sdk'
import { HotspotWithPendingRewards } from '../types/solana'
import { useKeyToAssetForHotspot } from './useKeyToAssetForHotspot'

export const useEntityKey = (
  hotspot: HotspotWithPendingRewards | undefined,
) => {
  const { info: kta } = useKeyToAssetForHotspot(hotspot)

  return kta ? decodeEntityKey(kta.entityKey, kta.keySerialization) : undefined
}
