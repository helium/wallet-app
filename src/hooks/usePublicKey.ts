import { PublicKey } from '@solana/web3.js'
import { useMemo } from 'react'

export const usePublicKey = (publicKey: PublicKey | string | undefined) => {
  return useMemo(() => {
    if (publicKey) {
      return new PublicKey(publicKey)
    }
  }, [publicKey])
}
