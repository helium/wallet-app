import {
  mobileInfoKey,
  rewardableEntityConfigKey,
} from '@helium/helium-entity-manager-sdk'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { MOBILE_SUB_DAO_KEY } from '@utils/constants'

const type = 'keyToAssetV0'

export const useKeyToAsset = (entityKey: string | undefined) => {
  const [mobileConfigKey] = rewardableEntityConfigKey(
    MOBILE_SUB_DAO_KEY,
    'MOBILE',
  )
  const [mobileInfo] = mobileInfoKey(mobileConfigKey, entityKey || '')

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<HeliumEntityManager, type>(mobileInfo, type)
}
