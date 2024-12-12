import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import ImageBox from '@components/ImageBox'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, ViewStyle } from 'react-native'
import Add from '@assets/svgs/add.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NavBarHeight } from '@components/ServiceNavBar'
import {
  OnboardingSheetRef,
  OnboardingSheetWrapper,
} from '@features/onboarding/OnboardingSheet'

const CreateSeedPhrasePage = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const { bottom } = useSafeAreaInsets()
  const onboardingSheetRef = useRef<OnboardingSheetRef>(null)

  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: spacing['2xl'],
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xl,
      paddingBottom: bottom + spacing['2xl'] + NavBarHeight,
    }),
    [spacing, bottom],
  )

  const showBottomSheet = useCallback(() => {
    onboardingSheetRef.current?.show('create-account')
  }, [onboardingSheetRef])

  return (
    <ScrollBox
      contentContainerStyle={contentContainerStyle as StyleProp<ViewStyle>}
    >
      <ImageBox source={require('@assets/images/acorn.png')} />
      <Text variant="displayMdSemibold" color="primaryText">
        {t('CreateSeedPhrasePage.title')}
      </Text>
      <Text
        variant="textXlRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('CreateSeedPhrasePage.subtitle')}
      </Text>
      <Box
        backgroundColor="cardBackground"
        borderRadius="2xl"
        padding="xl"
        marginBottom="2xl"
      >
        <Text variant="textMdSemibold" color="primaryText" textAlign="center">
          {t('CreateSeedPhrasePage.disclaimer')}
        </Text>
      </Box>

      <ButtonPressable
        title={t('CreateSeedPhrasePage.createSeedPhrase')}
        backgroundColor="primaryText"
        titleColor="primaryBackground"
        width={265.06}
        LeadingComponent={
          <Add width={17.06} height={17.06} color={colors.primaryBackground} />
        }
        onPress={showBottomSheet}
      />
      <OnboardingSheetWrapper ref={onboardingSheetRef} />
    </ScrollBox>
  )
}

export default CreateSeedPhrasePage
