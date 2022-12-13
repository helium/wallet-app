import { LazyDistributor, IDL } from '@helium/idls/lib/esm/lazy_distributor'
import { IdlAccounts } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { UseAccountState } from './useAccount'
import { useIdlAccount } from './useIdlAccount'

export type Recipient = IdlAccounts<typeof LazyDistributor>['recipientV0'] & {
  pubkey: PublicKey
}
const t = 'recipientV0'
export function useRecipient(key: PublicKey): UseAccountState<Recipient> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useIdlAccount<LazyDistributor>(key, IDL as LazyDistributor, t)
}
