import useAlert from '@hooks/useAlert'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useNavigation } from '@react-navigation/native'
import { useAppStorage } from '@storage/AppStorageProvider'
import { useModal } from '@storage/ModalsProvider'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HomeNavigationProp } from '../home/homeTypes'
import { usePersistedMigrationResume } from '../migration/hooks/useMigrationSession'
import { navigationRef } from '../../navigation/NavigationHelper'

const MigrateToWorldCheck: FC = () => {
  const wallet = useCurrentWallet()
  const walletAddress = wallet?.toBase58()
  const { shouldShowMigrateToWorld } = useAppStorage()
  const { showModal, type } = useModal()
  const homeNav = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { showOKCancelAlert } = useAlert()
  // Reuses the same AsyncStorage parsing/deriveResume as the flow screen so the
  // resumable detection can't drift from what the flow actually resumes.
  const { resume, loaded } = usePersistedMigrationResume(walletAddress)
  const hasShown = useRef(false)
  const [navTick, setNavTick] = useState(0)

  // A wallet address exists before onboarding finishes (accounts are upserted
  // ahead of the PIN steps), so wallet presence alone can't time the
  // announcement. Gate on actually being on the wallet home screen, and
  // re-evaluate on every navigation change so the card fires once the user
  // truly lands there.
  const onWalletHome = useCallback(
    () =>
      navigationRef.isReady() &&
      navigationRef.getCurrentRoute()?.name === 'AccountsScreen',
    [],
  )

  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () =>
      setNavTick((n) => n + 1),
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    if (hasShown.current) return undefined
    if (!walletAddress || type) return undefined
    // Wait for the persisted-session read before deciding, so the resume check
    // always wins by construction instead of racing the announcement timer.
    if (!loaded) return undefined

    // An in-flight migration takes priority over the announcement: offer to
    // resume rather than forcing the user into the flow. Accepting drops them
    // into the screen the resume effect lands on (retry/dismiss). Deferred
    // (not latched) until the user is on the home screen, so it can't
    // interrupt onboarding; the nav listener re-runs this effect.
    if (resume.canResume) {
      if (!onWalletHome()) return undefined
      hasShown.current = true
      showOKCancelAlert({
        title: t('migrateToWorld.resumeOffer.title'),
        message: t('migrateToWorld.resumeOffer.body'),
        ok: t('migrateToWorld.resumeOffer.resume'),
        cancel: t('migrateToWorld.resumeOffer.notNow'),
        cancelStyle: 'cancel',
      }).then((confirmed) => {
        if (confirmed) {
          homeNav.navigate('SettingsNavigator', {
            screen: 'MigrateToWorld',
          })
        }
      })
      return undefined
    }

    if (shouldShowMigrateToWorld(walletAddress)) {
      const timer = setTimeout(() => {
        // Route is checked at fire time (not arm time): the ref may not be
        // ready when the effect first runs on cold start, and the user can
        // navigate away during the delay. Skipping without latching lets the
        // next navigation event re-arm the timer.
        if (!onWalletHome()) return
        hasShown.current = true
        showModal({ type: 'MigrateToWorld' })
      }, 1500)

      return () => clearTimeout(timer)
    }
    return undefined
  }, [
    shouldShowMigrateToWorld,
    showModal,
    showOKCancelAlert,
    type,
    walletAddress,
    resume.canResume,
    loaded,
    homeNav,
    t,
    onWalletHome,
    navTick,
  ])

  return null
}

export default MigrateToWorldCheck
