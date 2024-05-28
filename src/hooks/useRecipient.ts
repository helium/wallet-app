import { IdlAccounts } from '@coral-xyz/anchor'
import { useAnchorAccount } from '@helium/helium-react-hooks'
import { LazyDistributor } from '@helium/idls/lib/types/lazy_distributor'
import { usePublicKey } from './usePublicKey'

const type = 'recipientV0'
export type RecipientV0 = IdlAccounts<LazyDistributor>['recipientV0']

export const useRecipient = (recipientKey: string | undefined) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return useAnchorAccount<LazyDistributor, type>(
    usePublicKey(recipientKey),
    type,
  )
}
