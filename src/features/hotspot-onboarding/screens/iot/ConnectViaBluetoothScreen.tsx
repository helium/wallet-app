import Box from '@components/Box'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import { useHotspotOnboarding } from '@features/hotspot-onboarding/OnboardingSheet'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import RightArrow from '@assets/svgs/rightArrow.svg'
import BluetoothIcon from '@assets/svgs/bluetooth.svg'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { ReAnimatedBox } from '@components/AnimatedBox'
import { ViewStyle, StyleProp } from 'react-native'

const ConnectViaBluetoothScreen = () => {
  const { t } = useTranslation()
  const colors = useColors()
  const spacing = useSpacing()
  const { carouselRef } = useHotspotOnboarding()

  const onScanForHotspots = useCallback(() => {
    carouselRef?.current?.snapToNext()
  }, [carouselRef])

  const contentContainerStyle = useMemo(() => {
    return {
      padding: spacing['2xl'],
      paddingBottom: spacing['4xl'],
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing['2.5'],
    }
  }, [spacing])

  return (
    <>
      <ScrollBox
        contentContainerStyle={contentContainerStyle as StyleProp<ViewStyle>}
      >
        <BluetoothIcon />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
        >
          {t('ConnectViaBluetoothScreen.title')}
        </Text>
        <Text
          variant="textLgRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('ConnectViaBluetoothScreen.subtitle')}
        </Text>
        <Text
          variant="textLgSemibold"
          color="primaryText"
          textAlign="center"
          mt="2xl"
          marginHorizontal="2xl"
        >
          {t('ConnectViaBluetoothScreen.body')}
        </Text>
      </ScrollBox>
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
          onPress={onScanForHotspots}
          backgroundColor="primaryText"
          backgroundColorPressed="primaryText"
          flexDirection="row"
          borderRadius="full"
          paddingStart="2xl"
          paddingEnd="4xl"
          paddingVertical="2xl"
          alignItems="center"
          pressableStyles={{ flex: undefined }}
        >
          <Text
            variant="textLgSemibold"
            color="primaryBackground"
            marginRight="md"
          >
            {t('ConnectViaBluetoothScreen.scanForHotspots')}
          </Text>
          <Box>
            <RightArrow color={colors.primaryBackground} />
          </Box>
        </TouchableContainer>
      </ReAnimatedBox>
    </>
  )
}

export default ConnectViaBluetoothScreen
