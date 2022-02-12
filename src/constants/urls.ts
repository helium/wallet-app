import { useMemo } from 'react'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { isMainnet } from '../utils/accountUtils'

export const EXPLORER_MAINNET_BASE_URL = 'https://explorer.helium.com'
export const EXPLORER_TESTNET_BASE_URL = 'https://explorer.helium.wtf'

const useExplorer = () => {
  const { currentAccount } = useAccountStorage()

  return useMemo(() => {
    const { address } = currentAccount || {}
    if (!address || isMainnet(address)) {
      return EXPLORER_MAINNET_BASE_URL
    }
    return EXPLORER_TESTNET_BASE_URL
  }, [currentAccount])
}

export { useExplorer }
