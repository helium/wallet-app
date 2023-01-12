import { Account, unpackAccount } from '@solana/spl-token'
import { AccountInfo, PublicKey } from '@solana/web3.js'
import { useAccount, UseAccountState } from './useAccount'

const parser = (
  pubkey: PublicKey,
  acct: AccountInfo<Buffer>,
): Account | undefined => {
  return unpackAccount(pubkey, acct)
}

export function useTokenAccount(
  address: PublicKey | undefined | null,
): UseAccountState<Account | undefined> {
  return useAccount(address, parser)
}
