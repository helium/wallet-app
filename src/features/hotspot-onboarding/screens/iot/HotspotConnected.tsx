import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ScrollBox from '@components/ScrollBox'
import CheckmarkCircle from '@assets/svgs/checkmarkCircle.svg'
import Text from '@components/Text'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import TouchableContainer from '@components/TouchableContainer'
import RightArrow from '@assets/svgs/rightArrow.svg'
import Box from '@components/Box'
import { useSpacing } from '@config/theme/themeHooks'
import { StyleProp, ViewStyle } from 'react-native'
import { useHotspotOnboarding } from '../../OnboardingSheet'

export default function HotspotConnected() {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const { carouselRef } = useHotspotOnboarding()

  const onConfirmLocation = useCallback(() => {
    carouselRef?.current?.snapToNext()
  }, [carouselRef])

  const contentContainerStyle = useMemo(() => {
    return {
      padding: spacing['2xl'],
      flex: 1,
      justifyContent: 'center',
    }
  }, [spacing])

  return (
    <ScrollBox
      contentContainerStyle={contentContainerStyle as StyleProp<ViewStyle>}
    >
      <Box alignItems="center" gap="2.5" paddingHorizontal="2xl">
        <CheckmarkCircle />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          paddingHorizontal="2xl"
          textAlign="center"
        >
          {t('hotspotOnboarding.onboarding.hotspotConnected')}
        </Text>
        <Text
          variant="textLgRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('hotspotOnboarding.onboarding.hotspotConnectedBody')}
        </Text>
      </Box>
      <ReAnimatedBox
        entering={FadeIn}
        exiting={FadeOut}
        flexDirection="row"
        justifyContent="flex-end"
        paddingBottom="4xl"
        paddingHorizontal="2xl"
        position="absolute"
        bottom={0}
        right={0}
      >
        <TouchableContainer
          onPress={onConfirmLocation}
          pressableStyles={{ flex: undefined }}
          backgroundColor="base.black"
          backgroundColorPressed="base.black"
          borderRadius="6xl"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          paddingHorizontal="4xl"
          paddingVertical="5"
          gap="md"
        >
          <Text variant="textLgSemibold" color="primaryBackground">
            {t('hotspotOnboarding.onboarding.confirmLocation')}
          </Text>
          <RightArrow width={15.84} height={15.84} color="white" />
        </TouchableContainer>
      </ReAnimatedBox>
    </ScrollBox>
  )
}
