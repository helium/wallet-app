import Box from '@components/Box'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import MobileIcon from '@assets/images/mobileIconNew.svg'
import IotIcon from '@assets/images/iotIconNew.svg'
import CarotRight from '@assets/images/carot-right.svg'
import { useColors } from '@theme/themeHooks'
import RightArrow from '@assets/images/rightArrow.svg'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { HOTSPOT_HELP } from '@constants/urls'
import { Linking } from 'react-native'
import { useHotspotOnboarding, OnboardDetails } from '../index'

const SelectNetworkScreen = () => {
  const { t } = useTranslation()
  const colors = useColors()
  const { setOnboardDetails, carouselRef } = useHotspotOnboarding()

  const onMobileSelected = useCallback(() => {
    setOnboardDetails((o: OnboardDetails) => ({ ...o, network: 'mobile' }))
    carouselRef?.current?.snapToNext()
  }, [setOnboardDetails, carouselRef])

  const onOpenHelp = useCallback(() => {
    Linking.openURL(HOTSPOT_HELP)
  }, [])

  return (
    <Box justifyContent="center" alignItems="center" padding="2xl" flex={1}>
      <Text variant="displayMdSemibold" color="primaryText" marginBottom="2.5">
        {t('SelectNetworkScreen.title')}
      </Text>
      <Text
        variant="textLgRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('SelectNetworkScreen.subtitle')}
      </Text>
      <TouchableContainer
        marginTop="2xl"
        backgroundColor="bg.brand-secondary"
        backgroundColorPressed="blue.light-200"
        padding="xl"
        paddingEnd="4xl"
        borderTopStartRadius="4xl"
        borderTopEndRadius="4xl"
        flexDirection="row"
        alignItems="center"
        onPress={onMobileSelected}
      >
        <MobileIcon />
        <Text
          variant="textLgSemibold"
          color="blue.dark-500"
          marginStart="2.5"
          flex={1}
        >
          MOBILE
        </Text>
        <CarotRight color={colors['blue.dark-500']} />
      </TouchableContainer>
      <TouchableContainer
        marginTop="0.5"
        marginBottom="2xl"
        backgroundColor="bg.success-primary"
        backgroundColorPressed="success.100"
        padding="xl"
        paddingEnd="4xl"
        borderBottomStartRadius="4xl"
        borderBottomEndRadius="4xl"
        flexDirection="row"
        alignItems="center"
      >
        <IotIcon />
        <Text
          variant="textLgSemibold"
          color="success.500"
          marginStart="2.5"
          flex={1}
        >
          IOT
        </Text>
        <CarotRight color={colors['success.500']} />
      </TouchableContainer>
      <TouchableOpacityBox
        flexDirection="row"
        alignItems="center"
        gap="sm"
        onPress={onOpenHelp}
      >
        <Text variant="textMdMedium" color="text.quaternary-500">
          {t('SelectNetworkScreen.helpText')}
        </Text>
        <RightArrow color={colors['text.quaternary-500']} />
      </TouchableOpacityBox>
    </Box>
  )
}

export default SelectNetworkScreen
