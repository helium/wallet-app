import { IDL } from '@helium/idls/lib/esm/treasury_management'
import { TreasuryManagement as TreasuryManagementType } from '@helium/idls/lib/types/treasury_management'
import { IdlAccounts } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { useIdlAccount } from './useIdlAccount'
import { UseAccountState } from './useAccount'

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
  return useIdlAccount<TreasuryManagementType>(
    key,
    IDL as TreasuryManagementType,
    type,
  )
}
