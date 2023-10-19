import { IdlAccounts } from '@coral-xyz/anchor'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { HeliumEntityManager } from '@helium/idls/lib/types/helium_entity_manager'
import { PublicKey } from '@solana/web3.js'

const type = 'makerApprovalV0'
export type MakerApprovalV0 =
  IdlAccounts<HeliumEntityManager>['makerApprovalV0'] & {
    pubKey: PublicKey
  }

export const useMakerApproval = (makerApproval: PublicKey | undefined) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<HeliumEntityManager, type>(makerApproval, type)
}
