import Box from '@components/Box'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import MobileTextLogo from '@assets/images/mobileTextLogo.svg'
import ImageBox from '@components/ImageBox'
import TextTransform from '@components/TextTransform'
import { DeviceType, useHotspotOnboarding } from '../../index'

const SelectDeviceScreen = () => {
  const { t } = useTranslation()
  const { carouselRef, setOnboardDetails } = useHotspotOnboarding()

  const onSelectHotspot = useCallback(
    (deviceType: DeviceType) => () => {
      setOnboardDetails((o) => ({
        ...o,
        deviceInfo: {
          ...o.deviceInfo,
          deviceType,
        },
      }))
      carouselRef?.current?.snapToNext()
    },
    [carouselRef, setOnboardDetails],
  )

  return (
    <Box justifyContent="center" alignItems="center" padding="2xl" flex={1}>
      <Text variant="displayMdSemibold" color="primaryText" marginBottom="2.5">
        {t('SelectDeviceScreen.title')}
      </Text>
      <Text
        variant="textLgRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('SelectDeviceScreen.subtitle')}
      </Text>
      <Box flexDirection="row" gap="0.5" marginTop="2xl">
        <TouchableContainer
          flex={1}
          flexBasis={0}
          padding="xl"
          borderTopStartRadius="4xl"
          borderBottomStartRadius="4xl"
          backgroundColor="bg.secondary-hover"
          backgroundColorPressed="gray.200"
          justifyContent="flex-end"
          alignItems="center"
          pressableStyles={{ flex: 1 }}
          onPress={onSelectHotspot('WifiIndoor')}
        >
          <Box height={109.63} width={135.46} marginBottom="6xl">
            <ImageBox
              source={require('@assets/images/indoorHotspot.png')}
              top={20}
              left={-32}
              right={0}
            />
          </Box>
          <MobileTextLogo />
          <Text variant="textXlSemibold" color="primaryText" marginTop="xs">
            {t('SelectDeviceScreen.indoor')}
          </Text>
        </TouchableContainer>
        <TouchableContainer
          padding="xl"
          borderTopEndRadius="4xl"
          borderBottomEndRadius="4xl"
          backgroundColor="bg.secondary-hover"
          backgroundColorPressed="gray.200"
          justifyContent="flex-end"
          alignItems="center"
          pressableStyles={{ flex: 1 }}
          onPress={onSelectHotspot('WifiOutdoor')}
        >
          <Box height={109.63} width={135.46} marginBottom="6xl">
            <ImageBox
              source={require('@assets/images/hotspotOutdoorSmall.png')}
              position="absolute"
              top={0}
              left={-30}
              right={0}
            />
          </Box>
          <MobileTextLogo />

          <TextTransform
            variant="textXlSemibold"
            color="primaryText"
            marginTop="xs"
            i18nKey="SelectDeviceScreen.outdoor"
          />
        </TouchableContainer>
      </Box>
    </Box>
  )
}

export default SelectDeviceScreen
