import useAlert from '@hooks/useAlert'
import { useNavigation } from '@react-navigation/native'
import { type BarcodeScanningResult, Camera, CameraView } from 'expo-camera'
import React, { useEffect, useEffectEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Platform, StyleSheet, View } from 'react-native'
import { BackScreen } from './BackScreen'

export type QrScannerProps = { onBarCodeScanned: (data: string) => void }

// A full-screen QR camera behind a back header. It reports the first scan
// only, and offers the app settings when camera access is denied.
export const QrScanner = ({ onBarCodeScanned }: QrScannerProps) => {
  const [hasPermission, setHasPermission] = useState<boolean>()
  const [scanned, setScanned] = useState(false)
  const navigation = useNavigation()
  const { showOKCancelAlert } = useAlert()
  const { t } = useTranslation()

  useEffect(() => {
    void Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted')
    })
  }, [])

  const askToOpenSettings = useEffectEvent(async () => {
    const decision = await showOKCancelAlert({
      title: t('qrScanner.deniedAlert.title'),
      message: t('qrScanner.deniedAlert.message'),
      ok: t('qrScanner.deniedAlert.ok'),
    })

    if (decision) {
      if (Platform.OS === 'ios') {
        void Linking.openURL('app-settings:')
      } else {
        void Linking.openSettings()
      }
    }

    navigation.goBack()
  })
  useEffect(() => {
    if (hasPermission !== false) return

    askToOpenSettings().catch((e) => console.error(e))
  }, [hasPermission, navigation, showOKCancelAlert])

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return

    setScanned(true)

    onBarCodeScanned(result.data)
  }

  if (!hasPermission) {
    return (
      <BackScreen>
        <View />
      </BackScreen>
    )
  }

  return (
    <BackScreen>
      <CameraView
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        style={StyleSheet.absoluteFill}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ratio="16:9"
      />
    </BackScreen>
  )
}
