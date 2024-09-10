/* eslint-disable no-console */
import React, { useEffect, useState } from 'react'
import { BarcodeScanningResult, Camera, CameraView } from 'expo-camera'
import { Linking, Platform, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import useAlert from '@hooks/useAlert'
import { CameraScannerLayout } from './CameraScannerLayout'
import Box from './Box'
import BackScreen from './BackScreen'
import ProgressBar from './ProgressBar'
import Text from './Text'

type Props = {
  progress: number
  onBarCodeScanned: (data: string) => void
}
const DynamicQrScanner = ({ onBarCodeScanned, progress }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean>()
  const navigation = useNavigation()
  const { showOKCancelAlert } = useAlert()
  const { t } = useTranslation()

  useEffect(() => {
    console.log('useEffect')
    Camera.requestCameraPermissionsAsync().then(
      ({ status }: { status: string }) => {
        setHasPermission(status === 'granted')
      },
    )
    console.log('useEffect2')
  }, [])

  useAsync(async () => {
    if (hasPermission !== false) return

    // if permission is not granted, show alert to open settings
    const decision = await showOKCancelAlert({
      title: t('qrScanner.deniedAlert.title'),
      message: t('qrScanner.deniedAlert.message'),
      ok: t('qrScanner.deniedAlert.ok'),
    })

    // if user clicks ok, open settings
    if (decision) {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:')
      } else {
        Linking.openSettings()
      }
    }

    // if user clicks cancel, go back to the previous screen
    if (decision === false) {
      navigation.goBack()
    }
  }, [hasPermission, navigation, showOKCancelAlert])

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    onBarCodeScanned(result.data)
  }

  return (
    <BackScreen padding="none">
      {/* if permission is not granted, show a black screen and notice alert modal */}
      {hasPermission !== true && <Box />}

      {hasPermission === true && (
        <Box flex={1}>
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            style={StyleSheet.absoluteFillObject}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ratio="16:9"
          />
          <CameraScannerLayout />

          <Box position="absolute" bottom="20%" width="70%" alignSelf="center">
            <ProgressBar progress={progress} />
          </Box>

          <Box
            position="absolute"
            bottom="10%"
            alignSelf="center"
            paddingHorizontal="s"
          >
            <Text variant="subtitle3" marginTop="xxxl" textAlign="center">
              {t('keystone.payment.scanTxQrcodeScreenSubtitle3')}
            </Text>
          </Box>
        </Box>
      )}
    </BackScreen>
  )
}
export default DynamicQrScanner
