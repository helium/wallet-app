import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import useHaptic from '@hooks/useHaptic'
import useAlert from '@hooks/useAlert'
import QrScanner from '@components/QrScanner'
import { EncyptedAccountRouteParam } from './CLIAccountNavigatorTypes'
import { useOnboardingSheet } from '../OnboardingSheet'
import { useOnboarding } from '../OnboardingProvider'

const CLIQrScanner = () => {
  const { triggerNotification } = useHaptic()
  const { showOKAlert } = useAlert()
  const { t } = useTranslation()
  const { carouselRef } = useOnboardingSheet()
  const { setOnboardingData } = useOnboarding()

  const handleBarCodeScanned = useCallback(
    async (data: string) => {
      const query = JSON.parse(data) as EncyptedAccountRouteParam
      if (query) {
        triggerNotification('success')
        setOnboardingData((prev) => ({
          ...prev,
          encryptedAccount: query,
        }))
        carouselRef?.current?.snapToNext()
      } else {
        await showOKAlert({
          title: t('payment.qrScanFail.title'),
          message: t('payment.qrScanFail.message'),
        })
        triggerNotification('error')
        carouselRef?.current?.snapToPrev()
      }
    },
    [triggerNotification, setOnboardingData, carouselRef, showOKAlert, t],
  )

  return <QrScanner onBarCodeScanned={handleBarCodeScanned} />
}
export default CLIQrScanner
