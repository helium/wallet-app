import ButtonPressable from '@components/ButtonPressable'
import ImageBox from '@components/ImageBox'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Scan from '@assets/svgs/scan.svg'
import { StyleProp, ViewStyle } from 'react-native'
import {
  OnboardingSheetRef,
  OnboardingSheetWrapper,
} from '@features/onboarding/OnboardingSheet'
import { useBottomSpacing } from '@hooks/useBottomSpacing'

const ConnectKeystonePage = () => {
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
      paddingBottom: bottomSpacing,
    }),
    [spacing, bottomSpacing],
  )

  const openOnboarding = useCallback(() => {
    onboardingSheetRef.current?.show('keystone')
  }, [onboardingSheetRef])

  return (
    <ScrollBox
      contentContainerStyle={contentContainerStyle as StyleProp<ViewStyle>}
    >
      <ImageBox
        marginTop="2xl"
        source={require('@assets/images/keystone.png')}
        marginBottom="3xl"
      />
      <Text variant="displayMdSemibold" color="primaryText" marginBottom="xl">
        {t('ConnectKeystonePage.title')}
      </Text>
      <Text
        variant="textXlRegular"
        color="text.quaternary-500"
        textAlign="center"
        marginBottom="3xl"
      >
        {t('ConnectKeystonePage.subtitle')}
      </Text>
      <ButtonPressable
        title={t('ConnectKeystonePage.scanQR')}
        backgroundColor="primaryText"
        titleColor="primaryBackground"
        width={265.06}
        LeadingComponent={
          <Scan width={18.71} height={18.71} color={colors.primaryBackground} />
        }
        onPress={openOnboarding}
      />
      <OnboardingSheetWrapper ref={onboardingSheetRef} />
    </ScrollBox>
  )
}

export default ConnectKeystonePage
