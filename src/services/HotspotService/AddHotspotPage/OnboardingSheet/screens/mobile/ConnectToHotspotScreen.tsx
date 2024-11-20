import Box from '@components/Box'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ImageBox from '@components/ImageBox'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import CameraCheck from '@assets/images/cameraCheck.svg'
import NoCamera from '@assets/images/noCamera.svg'
import RightArrow from '@assets/images/rightArrow.svg'
import { useColors } from '@theme/themeHooks'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { requestCameraPermission } from '@utils/camera'
import { PermissionStatus } from 'react-native-permissions'
import { Color } from '@theme/theme'
import { useHotspotOnboarding } from '../../index'
import CheckButton from '../../components/CheckButton'

export const ConnectToHotspotScreen = () => {
  const {
    manualEntry,
    setManualEntry,
    carouselRef,
    onboardDetails: {
      deviceInfo: { deviceType },
    },
  } = useHotspotOnboarding()
  const { t } = useTranslation()
  const colors = useColors()
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus>()

  const onRequest = useCallback(async () => {
    const status = __DEV__ ? 'granted' : await requestCameraPermission()

    setCameraPermission(status)

    if (status === 'granted') {
      setManualEntry(false)
    }
  }, [setManualEntry])

  useEffect(() => {
    if (manualEntry) {
      setCameraPermission(undefined)
    }
  }, [cameraPermission, manualEntry])

  const onNext = useCallback(() => {
    carouselRef?.current?.snapToNext()
  }, [carouselRef])

  const onManualEntry = useCallback(() => {
    setManualEntry(true)
    setCameraPermission(undefined)
    carouselRef?.current?.snapToNext()
  }, [setManualEntry, carouselRef])

  const CameraCheckButton = useCallback(() => {
    let backgroundColor: Color = 'primaryText'
    let backgroundColorPressed: Color = 'base.black'

    if (cameraPermission === 'granted') {
      backgroundColor = 'success.500'
      backgroundColorPressed = 'success.600'
    }

    if (cameraPermission === 'denied') {
      backgroundColor = 'error.500'
      backgroundColorPressed = 'error.600'
    }

    return (
      <TouchableContainer
        onPress={onRequest}
        backgroundColor={backgroundColor}
        backgroundColorPressed={backgroundColorPressed}
        borderRadius="full"
        flexDirection="row"
        paddingHorizontal="xl"
        paddingVertical="lg"
        pressableStyles={{
          flex: undefined,
        }}
        gap="2.5"
        marginVertical="2xl"
      >
        {cameraPermission === 'denied' && <NoCamera />}
        {cameraPermission === 'granted' && <CameraCheck />}
        <Text
          variant="textLgMedium"
          color="primaryBackground"
          textAlign="center"
        >
          {t('ConnectToHotspotScreen.requestCameraPermissions')}
        </Text>
      </TouchableContainer>
    )
  }, [t, onRequest, cameraPermission])

  return (
    <Box flex={1} padding="2xl" justifyContent="center" alignItems="center">
      {deviceType === 'WifiOutdoor' && (
        <ImageBox
          source={require('@assets/images/hotspotQR.png')}
          marginBottom="2xl"
        />
      )}
      {deviceType === 'WifiIndoor' && (
        <ImageBox
          source={require('@assets/images/indoorHotspotQR.png')}
          marginBottom="2xl"
        />
      )}
      <Text variant="displayMdSemibold" color="primaryText" marginBottom="2.5">
        {t('ConnectToHotspotScreen.title')}
      </Text>
      <Text
        variant="textLgRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('ConnectToHotspotScreen.subtitle')}
      </Text>
      <CameraCheckButton />
      <TouchableOpacityBox
        gap="sm"
        flexDirection="row"
        alignItems="center"
        onPress={onManualEntry}
      >
        <Text variant="textMdMedium" color="text.quaternary-500">
          {t('ConnectToHotspotScreen.manualEntry')}
        </Text>
        <RightArrow color={colors['text.quaternary-500']} />
      </TouchableOpacityBox>
      {cameraPermission === 'granted' && <CheckButton onPress={onNext} />}
    </Box>
  )
}

export default ConnectToHotspotScreen
