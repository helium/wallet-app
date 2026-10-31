import useAlert from '@hooks/useAlert'
import usePrevious from '@hooks/usePrevious'
import useSecureWindow from '@hooks/useSecureWindow'
import { ConfirmPinView } from '@ui/ConfirmPinView'
import * as LocalAuthentication from 'expo-local-authentication'
import React, { memo, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import useAppState from 'react-native-appstate-hook'
import Animated from 'react-native-reanimated'
import { FullWindowOverlay } from 'react-native-screens'
import { FADE_IN_STATE, FADE_OUT_STATE } from '@theme/motion'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import {
  deleteSecureItem,
  getSecureItem,
  storeSecureItem,
} from '../../storage/secureStorage'
import { withICloudSignOutWarning } from '../settings/signOutWarning'

type Props = { children: React.ReactNode }
const LockScreen = ({ children }: Props) => {
  const { t } = useTranslation()
  const { signOut, hasAccounts } = useAccountStorage()
  const { appState } = useAppState()
  const { pin, authInterval, locked, updateLocked } = useAppStorage()
  const prevLocked = usePrevious(locked)
  const { showOKCancelAlert } = useAlert()
  useSecureWindow(!!locked)

  useEffect(() => {
    if (locked === prevLocked || !prevLocked) return

    // clear idle when app is unlocked
    void storeSecureItem('lastIdle', Date.now().toString())
  }, [locked, prevLocked])

  useEffect(() => {
    // clear idle when pin is turned off
    if (pin?.status === 'off') {
      void deleteSecureItem('lastIdle')
    }
  }, [authInterval, locked, pin, prevLocked])

  // handle app state changes
  useEffect(() => {
    const run = async () => {
      if (locked || !pin || pin?.status === 'off' || !hasAccounts) return

      if (appState === 'background' || appState === 'inactive') {
        await storeSecureItem('lastIdle', Date.now().toString())
        return
      }

      const lastIdleString = await getSecureItem('lastIdle')

      if (!lastIdleString) return

      const lastIdle = Number.parseInt(lastIdleString, 10)
      const isActive = appState === 'active'
      const now = Date.now()
      const expiration = now - authInterval
      const lastIdleExpired = lastIdle && expiration > lastIdle

      // pin is required and last idle is past user interval, lock the screen
      const shouldLock = isActive && lastIdleExpired

      if (shouldLock) {
        await deleteSecureItem('lastIdle')
        await updateLocked(true)
      }
    }
    run().catch((e) => console.error(e))
  }, [appState, pin, authInterval, updateLocked, locked, hasAccounts])

  const handleSuccess = useCallback(async () => {
    await updateLocked(false)
  }, [updateLocked])

  const handleSignOut = useCallback(async () => {
    const decision = await showOKCancelAlert({
      title: t('auth.signOutAlert.title'),
      message: withICloudSignOutWarning(
        t,
        t('auth.signOutAlert.body'),
        'allWallets',
      ),
    })
    if (decision) {
      await signOut()
      await updateLocked(false)
    }
  }, [updateLocked, showOKCancelAlert, signOut, t])

  useEffect(() => {
    const run = async () => {
      if (!locked) return

      const localAuth = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync()
        const isEnrolled = await LocalAuthentication.isEnrolledAsync()
        if (!isEnrolled || !hasHardware) return

        const { success } = await LocalAuthentication.authenticateAsync()
        if (success) await handleSuccess()
      }

      await localAuth()
    }
    run().catch((e) => console.error(e))
  }, [handleSuccess, locked])

  const overlay = (
    <Animated.View
      entering={FADE_IN_STATE}
      exiting={FADE_OUT_STATE}
      className="absolute inset-0 z-[9999]"
    >
      <ConfirmPinView
        originalPin={pin?.value || ''}
        title={t('auth.title')}
        subtitle={t('auth.enterCurrent')}
        pinSuccess={() => void handleSuccess().catch(console.error)}
        onCancel={() => void handleSignOut().catch(console.error)}
        clearable
      />
    </Animated.View>
  )

  return (
    <>
      {children}
      {/* iOS draws the root view under native modal routes; FullWindowOverlay
          draws above the modals presented before it mounts */}
      {!!locked &&
        (Platform.OS === 'ios' ? (
          <FullWindowOverlay>{overlay}</FullWindowOverlay>
        ) : (
          overlay
        ))}
    </>
  )
}

export default memo(LockScreen)
