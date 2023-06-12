import { IDL } from '@helium/idls/lib/esm/helium_entity_manager'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { IdlAccounts } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { UseAccountState, useIdlAccount } from '@helium/helium-react-hooks'
import {
  mobileInfoKey,
  rewardableEntityConfigKey,
} from '@helium/helium-entity-manager-sdk'
import { MOBILE_SUB_DAO_KEY } from '@utils/constants'

const type = 'mobileHotspotInfoV0'
export type MobileHotspotInfoV0 =
  IdlAccounts<HeliumEntityManager>['mobileHotspotInfoV0'] & {
    pubKey: PublicKey
  }

export const useMobileInfo = (
  entityKey: string | undefined,
): UseAccountState<MobileHotspotInfoV0> | undefined => {
  const [mobileConfigKey] = rewardableEntityConfigKey(
    MOBILE_SUB_DAO_KEY,
    'MOBILE',
  )
  const [mobileInfo] = mobileInfoKey(mobileConfigKey, entityKey || '')
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useIdlAccount<HeliumEntityManager>(
    mobileInfo,
    IDL as HeliumEntityManager,
    type,
  )
}
