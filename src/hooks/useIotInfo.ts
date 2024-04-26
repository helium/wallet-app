import { IdlAccounts } from '@coral-xyz/anchor'
import { iotInfoKey } from '@helium/helium-entity-manager-sdk'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { IOT_CONFIG_KEY } from '@utils/constants'

const type = 'iotHotspotInfoV0'
export type IotHotspotInfoV0 =
  IdlAccounts<HeliumEntityManager>['iotHotspotInfoV0']

export const useIotInfo = (entityKey: string | undefined) => {
  const [iotInfo] = iotInfoKey(IOT_CONFIG_KEY, entityKey || '')

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<HeliumEntityManager, type>(iotInfo, type)
}
