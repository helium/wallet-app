import { useAnchorAccount } from '@helium/helium-react-hooks'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { usePublicKey } from './usePublicKey'

const type = 'keyToAssetV0'
export const useKeyToAsset = (keyToAssetKey: string | undefined) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<HeliumEntityManager, type>(
    usePublicKey(keyToAssetKey),
    type,
  )
}
