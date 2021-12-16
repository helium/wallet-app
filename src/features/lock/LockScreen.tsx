import React, { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as LocalAuthentication from 'expo-local-authentication'
import { AnimatePresence } from 'moti'
import ConfirmPinView from '../../components/ConfirmPinView'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import useAlert from '../../utils/useAlert'
import MotiBox from '../../components/MotiBox'

type Props = { children: React.ReactNode }
const LockScreen = ({ children }: Props) => {
  const { t } = useTranslation()
  const { pin, signOut } = useAccountStorage()
  const [locked, setLocked] = useState(false)
  const { showOKCancelAlert } = useAlert()

  useEffect(() => {
    if (pin?.status === 'restored') {
      setLocked(true)
    }
  }, [pin, setLocked])

  const handleSuccess = useCallback(() => {
    setLocked(false)
  }, [])

  const handleSignOut = useCallback(async () => {
    const decision = await showOKCancelAlert({
      title: t('auth.signOutAlert.title'),
      message: t('auth.signOutAlert.body'),
    })
    if (decision) {
      signOut()
      setLocked(false)
    }
  }, [showOKCancelAlert, signOut, t])

  useEffect(() => {
    if (!locked) return

    const localAuth = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      if (!isEnrolled || !hasHardware) return

      const { success } = await LocalAuthentication.authenticateAsync()
      if (success) handleSuccess()
    }

    localAuth()
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
            />
          </MotiBox>
        )}
      </AnimatePresence>
    </>
  )
}

export default memo(LockScreen)
