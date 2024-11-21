import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { usePublicKey } from './usePublicKey'

export function useCurrentWallet(): PublicKey | undefined {
  const { currentAccount } = useAccountStorage()

  return usePublicKey(currentAccount?.solanaAddress)
}
