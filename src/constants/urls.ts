import { useCallback } from 'react'
import { useSolana } from '../solana/SolanaProvider'

export const EXPLORER_MAINNET_BASE_URL = 'https://explorer.helium.com'
export const EXPLORER_TESTNET_BASE_URL = 'https://testnet-explorer.helium.com/'
export const SOLANA_EXPLORER_BASE_URL = 'https://explorer.solana.com'

export const PUBLIC_API_MAIN_URL = 'https://sharkfed.api.stakejoy.com/v1'
export const PUBLIC_API_TEST_URL = 'https://testnet-api.helium.wtf/v1'

export const PRIVACY_POLICY = 'https://wallet.helium.com/privacy-policy'
export const TERMS_OF_SERVICE = 'https://wallet.helium.com/terms-of-service'

type UrlType = 'block' | 'txn' | 'account' | 'validator' | 'hotspot'

const useCreateExplorerUrl = () => {
  const { cluster } = useSolana()

  const getPath = useCallback((type: UrlType) => {
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
  }, [])

  return useCallback(
    (type: UrlType, target?: string | number | null) => {
      const path = `${getPath(type)}/${target}`

      return `${SOLANA_EXPLORER_BASE_URL}/${path}?cluster=${cluster}`
    },
    [cluster, getPath],
  )
}

export { useCreateExplorerUrl }
