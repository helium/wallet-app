import { IdlAccounts } from '@coral-xyz/anchor'
import { UseAccountState } from '@helium/account-fetch-cache-hooks'
import {
  iotInfoKey,
  rewardableEntityConfigKey,
} from '@helium/helium-entity-manager-sdk'
import { useIdlAccount } from '@helium/helium-react-hooks'
import { IDL } from '@helium/idls/lib/esm/helium_entity_manager'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { PublicKey } from '@solana/web3.js'
import { IOT_SUB_DAO_KEY } from '@utils/constants'

const type = 'iotHotspotInfoV0'
export type IotHotspotInfoV0 =
  IdlAccounts<HeliumEntityManager>['iotHotspotInfoV0'] & {
    pubKey: PublicKey
  }

export const useIotInfo = (
  entityKey: string | undefined,
): UseAccountState<IotHotspotInfoV0> | undefined => {
  const [iotConfigKey] = rewardableEntityConfigKey(IOT_SUB_DAO_KEY, 'IOT')
  const [iotInfo] = iotInfoKey(iotConfigKey, entityKey || '')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useIdlAccount<HeliumEntityManager>(
    iotInfo,
    IDL as HeliumEntityManager,
    type,
  )
}
