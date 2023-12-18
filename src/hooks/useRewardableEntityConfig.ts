import { IdlAccounts } from '@coral-xyz/anchor'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { PublicKey } from '@solana/web3.js'
import { usePublicKey } from './usePublicKey'

const type = 'rewardableEntityConfigV0'
export type RewardableEntityConfigV0 =
  IdlAccounts<HeliumEntityManager>['rewardableEntityConfigV0'] & {
    pubKey: PublicKey
  }

export const useRewardableEntityConfig = (
  rewardableEntityConfigKey: string | undefined,
) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<HeliumEntityManager, type>(
    usePublicKey(rewardableEntityConfigKey),
    type,
  )
}
