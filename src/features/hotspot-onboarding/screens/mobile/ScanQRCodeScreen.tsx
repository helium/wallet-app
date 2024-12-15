import Box from '@components/Box'
import React, { useCallback, useEffect, useState } from 'react'
import { Linking, Platform, StyleSheet } from 'react-native'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors } from '@config/theme/themeHooks'
import RightArrow from '@assets/svgs/rightArrow.svg'
import useHaptic from '@hooks/useHaptic'
import { useAsync } from 'react-async-hook'
import Config from 'react-native-config'
import { BarcodeScanningResult, Camera, CameraView } from 'expo-camera'
import useAlert from '@hooks/useAlert'
import { useHotspotOnboarding } from '../../OnboardingSheet'
import CheckButton from '../../../../components/CheckButton'
import Loading from '../../../../components/LoadingButton'

const ScanQRCodeScreen = () => {
  const colors = useColors()
  const { triggerImpact } = useHaptic()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [scanned, setScanned] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean>()
  const { showOKCancelAlert } = useAlert()
  const { t } = useTranslation()

  const {
    carouselRef,
    setManualEntry,
    getDeviceInfo,
    getDeviceInfoLoading,
    getDeviceInfoError,
  } = useHotspotOnboarding()

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(
      ({ status }: { status: string }) => {
        setHasPermission(status === 'granted')
      },
    )
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
        await Linking.openURL('app-settings:')
      } else {
        await Linking.openSettings()
      }
    }
  }, [hasPermission, showOKCancelAlert])

  const onManualEntry = useCallback(() => {
    setManualEntry(true)
  }, [setManualEntry])

  const onNext = useCallback(async () => {
    if (__DEV__ && Config.MOCK_HMH === 'true') {
      // Make sure MOCK_HMH is set to true in .env
      await getDeviceInfo('MOCK_QR')
      carouselRef?.current?.snapToNext()
      return
    }

    if (!qrCode) return

    const deviceInfo = await getDeviceInfo(qrCode)

    if (deviceInfo) {
      carouselRef?.current?.snapToNext()
    }
  }, [carouselRef, getDeviceInfo, qrCode])

  const handleBarCodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (scanned) return

      setScanned(true)
      setQrCode(result.data)
    },
    [scanned],
  )

  useAsync(async () => {
    if (!qrCode) return
    triggerImpact('heavy')
    onNext()
  }, [qrCode, getDeviceInfo, onNext])

  return (
    <Box justifyContent="center" alignItems="center" flex={1} padding="2xl">
      <Box
        marginTop="2xl"
        marginBottom="2xl"
        height={190}
        width={190}
        overflow="hidden"
        borderColor="primaryText"
        padding="1"
        backgroundColor="primaryBackground"
        borderWidth={6}
        style={{ borderRadius: 30 }}
      >
        <Box
          borderColor="primaryBackground"
          flex={1}
          overflow="hidden"
          style={{
            borderRadius: 24,
          }}
        >
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            style={StyleSheet.absoluteFillObject}
            ratio="16:9"
          />
        </Box>
      </Box>
      <Text variant="displayMdSemibold" color="primaryText" marginBottom="2.5">
        {t('ScanQRCodeScreen.title')}
      </Text>
      <Text
        variant="textLgRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('ScanQRCodeScreen.subtitle')}
      </Text>
      <TouchableOpacityBox
        gap="sm"
        flexDirection="row"
        alignItems="center"
        marginTop="2xl"
        onPress={onManualEntry}
      >
        <Text variant="textMdMedium" color="text.quaternary-500">
          {t('ScanQRCodeScreen.manualEntry')}
        </Text>
        <RightArrow color={colors['text.quaternary-500']} />
      </TouchableOpacityBox>
      {getDeviceInfoError && (
        <Text
          variant="textLgMedium"
          color="error.500"
          marginTop="xl"
          textAlign="center"
        >
          {t('ScanQRCodeScreen.tryAgain')}
        </Text>
      )}
      {__DEV__ && !getDeviceInfoLoading && <CheckButton onPress={onNext} />}
      {getDeviceInfoLoading && <Loading />}
    </Box>
  )
}

export default ScanQRCodeScreen
