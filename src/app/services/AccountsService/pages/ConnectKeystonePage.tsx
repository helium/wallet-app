import ButtonPressable from '@components/ButtonPressable'
import ImageBox from '@components/ImageBox'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Scan from '@assets/svgs/scan.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NavBarHeight } from '@components/ServiceNavBar'
import { StyleProp, ViewStyle } from 'react-native'
import {
  OnboardingSheetRef,
  OnboardingSheetWrapper,
} from '@features/onboarding/OnboardingSheet'

const ConnectKeystonePage = () => {
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
      paddingBottom: bottom + spacing['2xl'] + NavBarHeight,
    }),
    [spacing, bottom],
  )

  const openOnboarding = useCallback(() => {
    onboardingSheetRef.current?.show('keystone')
  }, [onboardingSheetRef])

  return (
    <ScrollBox
      contentContainerStyle={contentContainerStyle as StyleProp<ViewStyle>}
    >
      <ImageBox
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
