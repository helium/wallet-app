import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import { FC, useEffect, useRef } from 'react'
import { HomeNavigationProp } from '../home/homeTypes'
import { useMigrationSession } from '../migration/hooks/useMigrationSession'

const MigrateToWorldCheck: FC = () => {
  const wallet = useCurrentWallet()
  const walletAddress = wallet?.toBase58()
  const { shouldShowMigrateToWorld } = useAppStorage()
  const { showModal, type } = useModal()
  const homeNav = useNavigation<HomeNavigationProp>()
  // Reuses the same AsyncStorage parsing/deriveResume as the flow screen so the
  // resumable detection can't drift from what the flow actually resumes.
  const { resume, loaded } = useMigrationSession(walletAddress)
  const hasShown = useRef(false)

  useEffect(() => {
    if (hasShown.current) return undefined
    if (!walletAddress || type) return undefined
    // Wait for the persisted-session read before deciding, so the resume check
    // always wins by construction instead of racing the announcement timer.
    if (!loaded) return undefined

    // An in-flight migration takes priority over the announcement: drop the user
    // straight into the flow, whose resume effect lands on the right outcome
    // screen (retry/dismiss) — that is the "Resume offer".
    if (resume.canResume) {
      hasShown.current = true
      homeNav.navigate('SettingsNavigator', { screen: 'MigrateToWorld' })
      return undefined
    }

    if (shouldShowMigrateToWorld(walletAddress)) {
      const timer = setTimeout(() => {
        hasShown.current = true
        showModal({ type: 'MigrateToWorld' })
      }, 1500)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [
    shouldShowMigrateToWorld,
    showModal,
    type,
    walletAddress,
    resume.canResume,
    loaded,
    homeNav,
  ])

  return null
}

export default MigrateToWorldCheck
