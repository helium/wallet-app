import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import * as LocalAuthentication from 'expo-local-authentication'
import { AnimatePresence } from 'moti'
import useAppState from 'react-native-appstate-hook'
import { useAsync } from 'react-async-hook'
import ConfirmPinView from '../../components/ConfirmPinView'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import useAlert from '../../utils/useAlert'
import MotiBox from '../../components/MotiBox'
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
  const { showOKCancelAlert } = useAlert()

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

      <AnimatePresence>
        {locked && (
          <MotiBox
            backgroundColor="primaryBackground"
            flex={1}
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            from={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
          >
            <ConfirmPinView
              originalPin={pin?.value || ''}
              title={t('auth.title')}
              subtitle={t('auth.enterCurrent')}
              pinSuccess={handleSuccess}
              onCancel={handleSignOut}
              clearable
            />
          </MotiBox>
        )}
      </AnimatePresence>
    </>
  )
}

export default memo(LockScreen)
