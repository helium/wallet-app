import { IdlAccounts } from '@coral-xyz/anchor'
import { UseAccountState } from '@helium/account-fetch-cache-hooks'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { TreasuryManagement as TreasuryManagementType } from '@helium/idls/lib/types/treasury_management'
import { PublicKey } from '@solana/web3.js'

export type TreasuryManagement =
  IdlAccounts<TreasuryManagementType>['treasuryManagementV0'] & {
    pubkey: PublicKey
  }
const type = 'treasuryManagementV0'
export function useTreasuryManagement(
  key: PublicKey,
): UseAccountState<TreasuryManagement> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<TreasuryManagementType, 'treasuryManagementV0'>(
    key,
    type,
  )
}
