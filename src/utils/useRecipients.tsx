import { IDL } from '@helium/idls/lib/esm/lazy_distributor'
import { PublicKey } from '@solana/web3.js'
import { UseAccountState } from './useAccount'
import { useIdlAccount } from './useIdlAccount'
import { Recipient } from './useRecipient'

const type = 'recipientV0'
export function useRecipients(keys: PublicKey[]): {
  [key: string]: UseAccountState<Recipient>
} {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return keys.map((k) => {
    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line react-hooks/rules-of-hooks
      k: useIdlAccount<LazyDistributor>(k, IDL as LazyDistributor, type),
    }
  })
}
