import { BorshAccountsCoder, Idl, IdlAccounts } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'
import { TypedAccountParser } from '@helium/spl-utils'
import { UseAccountState, useAccount } from './useAccount'
import * as Logger from '../utils/logger'

export function useIdlAccount<IDL extends Idl, A extends string = string>(
  key: PublicKey,
  idl: IDL,
  type: A,
): UseAccountState<IdlAccounts<Idl>[A]> {
  const parser: TypedAccountParser<IdlAccounts<Idl>[A]> = useMemo(() => {
    return (pubkey, data) => {
      try {
        const coder = new BorshAccountsCoder(idl)
        const decoded = coder.decode(type, data.data)
        decoded.pubkey = pubkey
        return decoded
      } catch (e) {
        Logger.error(e)
      }
    }
  }, [idl, type])
  return useAccount(key, parser)
}
