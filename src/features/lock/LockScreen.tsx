import { ReAnimatedBox } from '@components/AnimatedBox'
import ConfirmPinView from '@components/ConfirmPinView'
import useAlert from '@hooks/useAlert'
import usePrevious from '@hooks/usePrevious'
import * as LocalAuthentication from 'expo-local-authentication'
import React, { memo, useCallback, useEffect } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import useAppState from 'react-native-appstate-hook'
import { FadeIn, FadeOutDown } from 'react-native-reanimated'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAppStorage } from '../../storage/AppStorageProvider'
import {
  deleteSecureItem,
  getSecureItem,
  storeSecureItem,
} from '../../storage/secureStorage'

type Props = { children: React.ReactNode }
const LockScreen = ({ children }: Props) => {
  const { t } = useTranslation()
  const { signOut, hasAccounts } = useAccountStorage()
  const { appState } = useAppState()
  const { pin, authInterval, locked, updateLocked } = useAppStorage()
  const prevLocked = usePrevious(locked)
  const { showOKCancelAlert } = useAlert()

  useEffect(() => {
    if (locked === prevLocked || !prevLocked) return

    // clear idle when app is unlocked
    storeSecureItem('lastIdle', Date.now().toString())
  }, [locked, prevLocked])

  useEffect(() => {
    // clear idle when pin is turned off
    if (pin?.status === 'off') {
      deleteSecureItem('lastIdle')
    }
  }, [authInterval, locked, pin, prevLocked])

  // handle app state changes
  useAsync(async () => {
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
  }, [appState, pin, authInterval, updateLocked, locked, hasAccounts])

  const handleSuccess = useCallback(async () => {
    await updateLocked(false)
  }, [updateLocked])

  const handleSignOut = useCallback(async () => {
    const decision = await showOKCancelAlert({
      title: t('auth.signOutAlert.title'),
      message: t('auth.signOutAlert.body'),
    })
    if (decision) {
      await signOut()
      await updateLocked(false)
    }
  }, [updateLocked, showOKCancelAlert, signOut, t])

  useAsync(async () => {
    if (!locked) return

    const localAuth = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      if (!isEnrolled || !hasHardware) return

      const { success } = await LocalAuthentication.authenticateAsync()
      if (success) await handleSuccess()
    }

    await localAuth()
  }, [handleSuccess, locked])

  return (
    <>
      {children}
      {!!locked && (
        <ReAnimatedBox
          entering={FadeIn}
          exiting={FadeOutDown}
          zIndex={9999}
          top={0}
          bottom={0}
          left={0}
          right={0}
          position="absolute"
        >
          <ConfirmPinView
            originalPin={pin?.value || ''}
            title={t('auth.title')}
            subtitle={t('auth.enterCurrent')}
            pinSuccess={handleSuccess}
            onCancel={handleSignOut}
            clearable
          />
        </ReAnimatedBox>
      )}
    </>
  )
}

export default memo(LockScreen)
