import { IDL } from '@helium/idls/lib/esm/lazy_distributor'
import { LazyDistributor } from '@helium/idls/lib/types/lazy_distributor'
import { PublicKey } from '@solana/web3.js'
import { IdlAccounts } from '@coral-xyz/anchor'
import { UseAccountState, useIdlAccount } from '@helium/helium-react-hooks'
import { useAsync } from 'react-async-hook'
import { useCallback, useState } from 'react'

export type Recipient = IdlAccounts<LazyDistributor>['recipientV0'] & {
  pubkey: PublicKey
}
const t = 'recipientV0'
export function useRecipient(key: PublicKey): UseAccountState<Recipient> {
  const [, updateState] = useState<unknown>()

  const forceUpdate = useCallback(() => updateState({}), [])

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  const { loading, info } = useIdlAccount<LazyDistributor>(
    key,
    IDL as LazyDistributor,
    t,
  )

  useAsync(async () => {
    if (!info && !loading) {
      forceUpdate()
    }
  }, [info, loading])

  return {
    loading,
    info: info as Recipient,
  }
}
