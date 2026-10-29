import React, { useEffect, useEffectEvent, useMemo, useState } from 'react'
import DynamicQrScanner from '@components/DynamicQrScanner'
import SafeAreaBox from '@components/SafeAreaBox'
import { URDecoder } from '@ngraveio/bc-ur'
import KeystoneSDK, { MultiAccounts, UR } from '@keystonehq/keystone-sdk'
import { useNavigation } from '@react-navigation/native'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { KeystoneAccountType } from './SelectKeystoneAccountsScreen'
import { KeystoneNavigationProp } from './keystoneNavigatorTypes'

const ScanQrCodeScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<KeystoneNavigationProp>()
  const decoder = useMemo(() => new URDecoder(), [])
  const [progress, setProgress] = useState<number>(0)
  const [isUnexpectedQrCode, setIsUnexpectedQrCode] = useState(false)
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
        const derivationAccounts: KeystoneAccountType[] = []
        qrCodeDataRes.keys.forEach((key) => {
          derivationAccounts.push({
            path: key.path,
            publicKey: key.publicKey,
            masterFingerprint: qrCodeDataRes.masterFingerprint,
            device: qrCodeDataRes.device || 'Keystone Device',
          })
        })
        setProgress(0)
        navigation.navigate('SelectKeystoneAccounts', {
          derivationAccounts,
        })
      }
    } catch {
      setIsUnexpectedQrCode(true)
    }
  }

  const alertUnexpectedQrCode = useEffectEvent(() => {
    Alert.alert(
      t('keystone.connectKeystoneStart.unexpectedQrCodeTitle'),
      t('keystone.connectKeystoneStart.unexpectedQrCodeContent'),
    )
  })

  useEffect(() => {
    if (isUnexpectedQrCode) {
      alertUnexpectedQrCode()
    }
  }, [isUnexpectedQrCode])
  return (
    <SafeAreaBox flex={1}>
      <DynamicQrScanner
        onBarCodeScanned={handleBarCodeScanned}
        progress={progress}
      />
    </SafeAreaBox>
  )
}

export default ScanQrCodeScreen
