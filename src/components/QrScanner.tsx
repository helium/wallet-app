import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BarCodeScanningResult, Camera } from 'expo-camera'
import { Linking, Platform, StyleSheet } from 'react-native'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { useNavigation } from '@react-navigation/native'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import useAlert from '@hooks/useAlert'
import Box from './Box'
import BackScreen from './BackScreen'

type Props = { onBarCodeScanned: (data: string) => void }
const QrScanner = ({ onBarCodeScanned }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean>()
  const [scanned, setScanned] = useState(false)
  const navigation = useNavigation()
  const { showOKCancelAlert } = useAlert()
  const { t } = useTranslation()

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted')
    })
  }, [])

  useAsync(async () => {
    if (hasPermission !== false) return

    const decision = await showOKCancelAlert({
      title: t('qrScanner.deniedAlert.title'),
      message: t('qrScanner.deniedAlert.message'),
      ok: t('qrScanner.deniedAlert.ok'),
    })

    if (decision) {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:')
      } else {
        Linking.openSettings()
      }
    }

    navigation.goBack()
  }, [hasPermission, navigation, showOKCancelAlert])

  const barCodeScannerSettings = useMemo(
    () => ({
      barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
    }),
    [],
  )
  const handleBarCodeScanned = useCallback(
    async (result: BarCodeScanningResult) => {
      if (scanned) return

      setScanned(true)

      onBarCodeScanned(result.data)
    },
    [onBarCodeScanned, scanned],
  )

  if (!hasPermission) {
    return (
      <BackScreen>
        <Box />
      </BackScreen>
    )
  }

  return (
    <BackScreen>
      <Camera
        onBarCodeScanned={handleBarCodeScanned}
        barCodeScannerSettings={barCodeScannerSettings}
        style={StyleSheet.absoluteFillObject}
        ratio="16:9"
      />
    </BackScreen>
  )
}
export default QrScanner
