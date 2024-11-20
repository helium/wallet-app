import Box from '@components/Box'
import React, { useCallback } from 'react'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import ImageBox from '@components/ImageBox'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import InfoIcon from '@assets/images/infoIcon.svg'
import { Linking } from 'react-native'
import { HOTSPOT_HELP } from '@constants/urls'
import CheckButton from '../../components/CheckButton'
import { useHotspotOnboarding } from '../../index'

export const ConnectEthernetScreen = () => {
  const { t } = useTranslation()

  const {
    carouselRef,
    onboardDetails: {
      deviceInfo: { deviceType },
    },
  } = useHotspotOnboarding()

  const onNext = useCallback(() => {
    carouselRef?.current?.snapToNext()
  }, [carouselRef])

  const onOpenHelp = useCallback(() => {
    Linking.openURL(HOTSPOT_HELP)
  }, [])

  return (
    <Box justifyContent="center" alignItems="center" flex={1} padding="2xl">
      {deviceType === 'WifiOutdoor' && (
        <ImageBox
          source={require('@assets/images/hotspotEthernet.png')}
          marginBottom="2xl"
        />
      )}
      {deviceType === 'WifiIndoor' && (
        <ImageBox
          source={require('@assets/images/indoorHotspotEthernet.png')}
          marginBottom="2xl"
        />
      )}
      <Text
        variant="displayMdSemibold"
        color="primaryText"
        marginBottom="2.5"
        textAlign="center"
      >
        {t(
          deviceType === 'WifiOutdoor'
            ? 'ConnectEthernetScreen.title'
            : 'ConnectEthernetScreen.titleIndoor',
        )}
      </Text>
      <Text
        variant="textLgRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {deviceType === 'WifiOutdoor'
          ? t('ConnectEthernetScreen.subtitle')
          : t('ConnectEthernetScreen.subtitleIndoor')}
      </Text>
      <Text
        variant="textLgMedium"
        color="text.brand-tertiary-600"
        marginTop="2.5"
      >
        {t('ConnectEthernetScreen.helpText')}
      </Text>
      <TouchableOpacityBox
        onPress={onOpenHelp}
        marginTop="2xl"
        borderRadius="full"
        backgroundColor="bg.quaternary"
        paddingHorizontal="xl"
        paddingVertical="2"
        flexDirection="row"
        alignItems="center"
        gap="sm"
      >
        <InfoIcon />
        <Text variant="textLgMedium" color="text.quaternary-500">
          {t('ConnectEthernetScreen.help')}
        </Text>
      </TouchableOpacityBox>
      <CheckButton onPress={onNext} />
    </Box>
  )
}

export default ConnectEthernetScreen
