import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import Add from '@assets/svgs/add.svg'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import RightArrow from '@assets/svgs/rightArrow.svg'
import ScrollBox from '@components/ScrollBox'
import {
  OnboardingSheetWrapper,
  OnboardingSheetRef,
} from '@features/hotspot-onboarding/OnboardingSheet'
import { useBottomSpacing } from '@hooks/useBottomSpacing'

const AddHotspotPage = () => {
  const { t } = useTranslation()
  const colors = useColors()
  const spacing = useSpacing()
  const onboardingSheetRef = useRef<OnboardingSheetRef>(null)
  const bottomSpacing = useBottomSpacing()

  const showOnboardingSheet = useCallback(() => {
    onboardingSheetRef.current?.show()
  }, [onboardingSheetRef])

  const contentContainerStyle = useMemo(() => {
    return {
      padding: spacing['2xl'],
    }
  }, [spacing])

  return (
    <>
      <ScrollBox contentContainerStyle={contentContainerStyle}>
        <Box flex={1}>
          <Box
            borderRadius="6xl"
            overflow="hidden"
            shadowColor="primaryText"
            shadowOffset={{
              height: 20,
              width: 20,
            }}
            shadowRadius={4}
            shadowOpacity={0.25}
            elevation={9}
          >
            <Image source={require('@assets/images/addHotspotImage.png')} />
          </Box>
          <Text
            variant="displayMdSemibold"
            color="primaryText"
            textAlign="center"
            marginBottom="xl"
            marginTop="8xl"
            paddingHorizontal="2xl"
          >
            {t('AddHotspotPage.title')}
          </Text>
          <Text
            variant="textLgRegular"
            color="text.quaternary-500"
            textAlign="center"
            marginBottom="3xl"
          >
            {t('AddHotspotPage.subtitle')}
          </Text>
          <ButtonPressable
            LeadingComponent={
              <Add
                color={colors.primaryBackground}
                width={17.06}
                height={17.06}
              />
            }
            backgroundColor="primaryText"
            titleColor="primaryBackground"
            title={t('AddHotspotPage.addHotspot')}
            onPress={showOnboardingSheet}
            marginBottom="3xl"
          />
          <Box
            flexDirection="row"
            alignItems="center"
            gap="sm"
            justifyContent="center"
            style={{
              marginBottom: bottomSpacing,
            }}
          >
            <Text variant="textMdMedium" color="text.quaternary-500">
              {t('AddHotspotPage.locationAndMountingTips')}
            </Text>
            <RightArrow color={colors['text.quaternary-500']} />
          </Box>
        </Box>
      </ScrollBox>
      <OnboardingSheetWrapper ref={onboardingSheetRef} />
    </>
  )
}

export default AddHotspotPage
