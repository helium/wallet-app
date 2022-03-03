import { useMemo } from 'react'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { isMainnet } from '../utils/accountUtils'

export const EXPLORER_MAINNET_BASE_URL = 'https://explorer.helium.com'
export const EXPLORER_TESTNET_BASE_URL = 'https://testnet-explorer.helium.com/'

export const PUBLIC_API_MAIN_URL = 'https://sharkfed.api.stakejoy.com/v1'
export const PUBLIC_API_TEST_URL = 'https://testnet-api.helium.wtf/v1'

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

const usePublicApi = () => {
  const { currentAccount } = useAccountStorage()

  return useMemo(() => {
    const { address } = currentAccount || {}
    if (!address || isMainnet(address)) {
      return PUBLIC_API_MAIN_URL
    }
    return PUBLIC_API_TEST_URL
  }, [currentAccount])
}

export { useExplorer, usePublicApi }
