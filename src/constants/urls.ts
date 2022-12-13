import { useCallback, useMemo } from 'react'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { isMainnet } from '../utils/accountUtils'

export const EXPLORER_MAINNET_BASE_URL = 'https://explorer.helium.com'
export const EXPLORER_TESTNET_BASE_URL = 'https://testnet-explorer.helium.com/'
export const SOLANA_EXPLORER_BASE_URL = 'https://explorer.solana.com'

export const PUBLIC_API_MAIN_URL = 'https://sharkfed.api.stakejoy.com/v1'
export const PUBLIC_API_TEST_URL = 'https://testnet-api.helium.wtf/v1'

export const PRIVACY_POLICY = 'https://wallet.helium.com/privacy-policy'
export const TERMS_OF_SERVICE = 'https://wallet.helium.com/terms-of-service'

type UrlType = 'block' | 'txn' | 'account' | 'validator' | 'hotspot'

const useCreateExplorerUrl = () => {
  const { currentAccount } = useAccountStorage()
  const { l1Network, solanaNetwork: cluster } = useAppStorage()

  const getPath = useCallback(
    (type: UrlType) => {
      if (l1Network === 'solana') {
        switch (type) {
          case 'block':
            return 'block'
          case 'txn':
            return 'tx'
          case 'account':
          case 'validator':
          case 'hotspot':
            return 'address'
        }
      }

      switch (type) {
        case 'block':
          return 'blocks'
        case 'txn':
          return 'txns'
        case 'account':
          return 'accounts'
        case 'validator':
          return 'validators'
        case 'hotspot':
          return 'hotspots'
      }
    },
    [l1Network],
  )

  return useCallback(
    (type: UrlType, target?: string | number | null) => {
      const path = `${getPath(type)}/${target}`

      if (l1Network === 'solana') {
        return `${SOLANA_EXPLORER_BASE_URL}/${path}?cluster=${cluster}`
      }

      const { address } = currentAccount || {}
      if (!address || isMainnet(address)) {
        return `${EXPLORER_MAINNET_BASE_URL}/${path}`
      }
      return `${EXPLORER_TESTNET_BASE_URL}/${path}`
    },
    [cluster, currentAccount, getPath, l1Network],
  )
}

const usePublicApi = () => {
  const { currentAccount } = useAccountStorage()
  const { l1Network } = useAppStorage()

  return useMemo(() => {
    if (l1Network === 'solana') return ''

    const { address } = currentAccount || {}
    if (!address || isMainnet(address)) {
      return PUBLIC_API_MAIN_URL
    }
    return PUBLIC_API_TEST_URL
  }, [currentAccount, l1Network])
}

export { useCreateExplorerUrl, usePublicApi }
