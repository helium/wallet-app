import { PublicKey } from '@solana/web3.js'
import { useAccount } from './useAccount'

export function useSolOwnedAmount(ownerPublicKey?: PublicKey): {
  amount: bigint
  loading: boolean
} {
  const { info: lamports, loading } = useAccount<bigint>(
    ownerPublicKey,
    (_, account) => BigInt(account.lamports),
  )

  return {
    amount: lamports || BigInt(0),
    loading,
  }
}
