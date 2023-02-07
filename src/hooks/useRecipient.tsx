import { IDL } from '@helium/idls/lib/esm/lazy_distributor'
import { LazyDistributor } from '@helium/idls/lib/types/lazy_distributor'
import { PublicKey } from '@solana/web3.js'
import { IdlAccounts } from '@coral-xyz/anchor'
import { UseAccountState, useIdlAccount } from '@helium/helium-react-hooks'

export type Recipient = IdlAccounts<LazyDistributor>['recipientV0'] & {
  pubkey: PublicKey
}
const t = 'recipientV0'
export function useRecipient(key: PublicKey): UseAccountState<Recipient> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useIdlAccount<LazyDistributor>(key, IDL as LazyDistributor, t)
}
