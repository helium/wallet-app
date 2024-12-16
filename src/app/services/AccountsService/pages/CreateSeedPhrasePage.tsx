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
import {
  OnboardingSheetRef,
  OnboardingSheetWrapper,
} from '@features/onboarding/OnboardingSheet'
import { useBottomSpacing } from '@hooks/useBottomSpacing'

const CreateSeedPhrasePage = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const bottomSpacing = useBottomSpacing()

  const onboardingSheetRef = useRef<OnboardingSheetRef>(null)

  const contentContainerStyle = useMemo(
    () => ({
      padding: spacing['2xl'],
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xl,
      paddingBottom: bottomSpacing,
    }),
    [spacing, bottomSpacing],
  )

  const showBottomSheet = useCallback(() => {
    onboardingSheetRef.current?.show('create-account')
  }, [onboardingSheetRef])

  return (
    <ScrollBox
      flex={1}
      contentContainerStyle={contentContainerStyle as StyleProp<ViewStyle>}
    >
      <ImageBox marginTop="2xl" source={require('@assets/images/acorn.png')} />
      <Text variant="displayMdSemibold" color="primaryText" textAlign="center">
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
