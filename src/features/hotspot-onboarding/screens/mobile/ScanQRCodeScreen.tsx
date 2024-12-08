import Box from '@components/Box'
import React, { useCallback, useState } from 'react'
import { StyleSheet } from 'react-native'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors } from '@config/theme/themeHooks'
import RightArrow from '@assets/svgs/rightArrow.svg'
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera'
import useAppear from '@hooks/useAppear'
import useDisappear from '@hooks/useDisappear'
import useHaptic from '@hooks/useHaptic'
import { useAsync } from 'react-async-hook'
import Config from 'react-native-config'
import { useHotspotOnboarding } from '../../OnboardingSheet'
import CheckButton from '../../../../components/CheckButton'
import Loading from '../../../../components/LoadingButton'

const ScanQRCodeScreen = () => {
  const { t } = useTranslation()
  const colors = useColors()
  const [isActive, setIsActive] = useState(false)
  const { triggerImpact } = useHaptic()
  const [qrCode, setQrCode] = useState<string | null>(null)

  const {
    carouselRef,
    setManualEntry,
    getDeviceInfo,
    getDeviceInfoLoading,
    getDeviceInfoError,
    onboardDetails,
  } = useHotspotOnboarding()

  const onManualEntry = useCallback(() => {
    setManualEntry(true)
  }, [setManualEntry])

  const device = useCameraDevice('back', {
    physicalDevices: ['ultra-wide-angle-camera'],
  })

  useAppear(() => {
    setIsActive(true)
  })

  useDisappear(() => {
    setIsActive(false)
  })
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

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (!codes.length || !codes[0].value || onboardDetails.qrCode) return

      setQrCode(codes[0].value)
    },
  })

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
          {device ? (
            <Camera
              style={{ ...StyleSheet.absoluteFillObject }}
              device={device}
              isActive={isActive}
              codeScanner={codeScanner}
            />
          ) : (
            <Box flex={1} backgroundColor="primaryText" />
          )}
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
