import React, { useCallback, useEffect, useState } from 'react'
import { BarcodeScanningResult, Camera, CameraView } from 'expo-camera'
import { Linking, Platform, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import useAlert from '@hooks/useAlert'
import { useSpacing } from '@config/theme/themeHooks'
import Box from './Box'
import BackScreen from './BackScreen'

type Props = { onBarCodeScanned: (data: string) => void }
const QrScanner = ({ onBarCodeScanned }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean>()
  const [scanned, setScanned] = useState(false)
  const navigation = useNavigation()
  const spacing = useSpacing()
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

  const handleBarCodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
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
    <Box flex={1}>
      <CameraView
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        style={{
          ...StyleSheet.absoluteFillObject,
          overflow: 'hidden',
          borderTopStartRadius: spacing['6xl'],
          borderTopEndRadius: spacing['6xl'],
        }}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ratio="16:9"
      />
    </Box>
  )
}
export default QrScanner
