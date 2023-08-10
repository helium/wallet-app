import { decodeEntityKey } from '@helium/helium-entity-manager-sdk'
import { HotspotWithPendingRewards } from '../types/solana'
import { useKeyToAsset } from './useKeyToAsset'

export const useEntityKey = (hotspot: HotspotWithPendingRewards) => {
  const { info: kta } = useKeyToAsset(hotspot?.id)

  return kta ? decodeEntityKey(kta.entityKey, kta.keySerialization) : undefined
}
