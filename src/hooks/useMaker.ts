import { IdlAccounts } from '@coral-xyz/anchor'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { usePublicKey } from './usePublicKey'

const type = 'makerV0'
export type MakerV0 = IdlAccounts<HeliumEntityManager>['makerV0']

export const useMaker = (makerKey: string | undefined) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<HeliumEntityManager, type>(
    usePublicKey(makerKey),
    type,
  )
}
