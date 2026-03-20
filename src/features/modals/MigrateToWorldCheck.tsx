import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import { FC, useEffect, useRef } from 'react'

const MigrateToWorldCheck: FC = () => {
  const wallet = useCurrentWallet()
  const { shouldShowMigrateToWorld } = useAppStorage()
  const { showModal, type } = useModal()
  const hasShown = useRef(false)

  useEffect(() => {
    if (hasShown.current) return

    const walletAddress = wallet?.toBase58()
    const shouldShow = walletAddress
      ? shouldShowMigrateToWorld(walletAddress)
      : false

    if (shouldShow && !type && wallet) {
      const timer = setTimeout(() => {
        hasShown.current = true
        showModal({ type: 'MigrateToWorld' })
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [shouldShowMigrateToWorld, showModal, type, wallet])

  return null
}

export default MigrateToWorldCheck
