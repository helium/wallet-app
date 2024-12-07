import React, { useEffect, useMemo, useState } from 'react'
import DynamicQrScanner from '@components/DynamicQrScanner'
import { URDecoder } from '@ngraveio/bc-ur'
import KeystoneSDK, { MultiAccounts, UR } from '@keystonehq/keystone-sdk'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useOnboardingSheet } from '@features/onboarding/OnboardingSheet'
import { KeystoneAccountType } from './SelectKeystoneAccountsScreen'
import { useKeystoneOnboarding } from './KeystoneOnboardingProvider'

const ScanQrCodeScreen = () => {
  const { t } = useTranslation()
  const [multiAccounts, setMultiAccounts] = useState<MultiAccounts>()
  const decoder = useMemo(() => new URDecoder(), [])
  const [isScanQrCodeComplete, setIsScanQrCodeComplete] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [isUnexpectedQrCode, setIsUnexpectedQrCode] = useState(false)
  const { setKeystoneOnboardingData } = useKeystoneOnboarding()
  const { carouselRef } = useOnboardingSheet()

  const handleBarCodeScanned = (qrString: string) => {
    // fix unexpected qrcode string
    try {
      decoder.receivePart(qrString.toLowerCase())
      setProgress(Number((decoder.getProgress() * 100).toFixed(0)))
      if (decoder.isComplete()) {
        const ur = decoder.resultUR()
        const qrCodeDataRes: MultiAccounts =
          new KeystoneSDK().parseMultiAccounts(
            new UR(Buffer.from(ur.cbor.toString('hex'), 'hex'), ur.type),
          )
        setProgress(100)
        setIsScanQrCodeComplete(true)
        setMultiAccounts(qrCodeDataRes)
      }
    } catch (error) {
      setIsUnexpectedQrCode(true)
    }
  }

  useEffect(() => {
    if (isUnexpectedQrCode) {
      Alert.alert(
        t('keystone.connectKeystoneStart.unexpectedQrCodeTitle'),
        t('keystone.connectKeystoneStart.unexpectedQrCodeContent'),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnexpectedQrCode])

  useEffect(() => {
    if (isScanQrCodeComplete) {
      const derivationAccounts: KeystoneAccountType[] = []
      multiAccounts?.keys.forEach((key) => {
        derivationAccounts.push({
          path: key.path,
          publicKey: key.publicKey,
          masterFingerprint: multiAccounts.masterFingerprint,
          device: multiAccounts.device || 'Keystone Device',
        })
      })
      setProgress(0)
      setIsScanQrCodeComplete(false)
      setKeystoneOnboardingData((o) => ({
        ...o,
        derivationAccounts,
      }))
      carouselRef?.current?.snapToNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanQrCodeComplete, setKeystoneOnboardingData, carouselRef])
  return (
    <DynamicQrScanner
      onBarCodeScanned={handleBarCodeScanned}
      progress={progress}
    />
  )
}

export default ScanQrCodeScreen
