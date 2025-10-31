import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useDeprecatedTokens } from '@storage/DeprecatedTokensProvider'
import { useModal } from '@storage/ModalsProvider'
import { FC, useEffect } from 'react'

/**
 * Component that checks if user has IOT or MOBILE tokens (staked or unstaked)
 * and shows the deprecation modal if they haven't dismissed it
 */
const DeprecatedTokensCheck: FC = () => {
  const wallet = useCurrentWallet()
  const { shouldShowDeprecatedTokens } = useAppStorage()
  const { showModal } = useModal()

  // Use shared deprecated tokens data
  const { hasDeprecatedTokens, loading } = useDeprecatedTokens()

  useEffect(() => {
    // Show modal if:
    // 1. Enough time has passed based on dismiss count (exponential backoff)
    // 2. User has IOT or MOBILE tokens
    // 3. Data is loaded
    const walletAddress = wallet?.toBase58()
    const shouldShow = walletAddress
      ? shouldShowDeprecatedTokens(walletAddress)
      : false

    if (shouldShow && hasDeprecatedTokens && !loading && wallet) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        showModal({ type: 'DeprecatedTokens' })
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [
    shouldShowDeprecatedTokens,
    hasDeprecatedTokens,
    loading,
    showModal,
    wallet,
  ])

  return null
}

export default DeprecatedTokensCheck
