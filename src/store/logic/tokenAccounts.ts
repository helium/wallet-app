import { AccountLayout, AccountState } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

export type DecodedTokenAccount = {
  mint: PublicKey
  amount: bigint
  frozen: boolean
}

// Balance sync only reads the fields the stored token account keeps. Frozen
// accounts (e.g. Data Credits) can't be transferred, so flows that move tokens
// need the account state alongside the balance.
export const decodeTokenAccount = (data: Buffer): DecodedTokenAccount => {
  const account = AccountLayout.decode(data)
  return {
    mint: account.mint,
    amount: account.amount,
    frozen: account.state === AccountState.Frozen,
  }
}
