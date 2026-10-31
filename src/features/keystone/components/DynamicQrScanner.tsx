import React, { useEffect, useEffectEvent, useState } from 'react'
import { BarcodeScanningResult, Camera, CameraView } from 'expo-camera'
import { Linking, Platform, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import useAlert from '@hooks/useAlert'
import BackButton from '@components/BackButton'
import { Text } from '@ui/Text'
import { CameraScannerLayout } from './CameraScannerLayout'
import ProgressBar from './ProgressBar'

const SafeArea = withUniwind(SafeAreaView)

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
    void Camera.requestCameraPermissionsAsync().then(
      ({ status }: { status: string }) => {
        setHasPermission(status === 'granted')
      },
    )
  }, [])

  const askToOpenSettings = useEffectEvent(async () => {
    // if permission is not granted, show alert to open settings
    const decision = await showOKCancelAlert({
      title: t('qrScanner.deniedAlert.title'),
      message: t('qrScanner.deniedAlert.message'),
      ok: t('qrScanner.deniedAlert.ok'),
    })

    // if user clicks ok, open settings
    if (decision) {
      if (Platform.OS === 'ios') {
        void Linking.openURL('app-settings:')
      } else {
        void Linking.openSettings()
      }
    }

    // if user clicks cancel, go back to the previous screen
    if (decision === false) {
      navigation.goBack()
    }
  })
  useEffect(() => {
    if (hasPermission !== false) return

    askToOpenSettings().catch((e) => console.error(e))
  }, [hasPermission, navigation, showOKCancelAlert])

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    onBarCodeScanned(result.data)
  }

  return (
    <SafeArea className="flex-1">
      <View className="flex-row px-7">
        <BackButton
          marginHorizontal="n_ms"
          paddingHorizontal="none"
          onPress={navigation.goBack}
        />
      </View>
      {/* if permission is not granted, show a black screen and notice alert modal */}
      {hasPermission !== true && <View />}

      {hasPermission === true && (
        <View className="flex-1">
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            style={StyleSheet.absoluteFill}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ratio="16:9"
          />
          <CameraScannerLayout />

          <View className="absolute bottom-[20%] w-[70%] self-center">
            <ProgressBar progress={progress} />
          </View>

          <View className="absolute bottom-[10%] self-center px-2">
            <Text size="base" className="mt-15 text-center font-medium">
              {t('keystone.payment.scanTxQrcodeScreenSubtitle3')}
            </Text>
          </View>
        </View>
      )}
    </SafeArea>
  )
}
export default DynamicQrScanner
