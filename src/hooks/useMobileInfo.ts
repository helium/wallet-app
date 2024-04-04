import { IdlAccounts } from '@coral-xyz/anchor'
import { mobileInfoKey } from '@helium/helium-entity-manager-sdk'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { MOBILE_CONFIG_KEY } from '@utils/constants'

const type = 'mobileHotspotInfoV0'
export type MobileHotspotInfoV0 =
  IdlAccounts<HeliumEntityManager>['mobileHotspotInfoV0']

export const useMobileInfo = (entityKey: string | undefined) => {
  const [mobileInfo] = mobileInfoKey(MOBILE_CONFIG_KEY, entityKey || '')

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<HeliumEntityManager, type>(mobileInfo, type)
}
