import ButtonPressable from '@components/ButtonPressable'
import ImageBox from '@components/ImageBox'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Bluetooth from '@assets/svgs/bluetooth.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NavBarHeight } from '@components/ServiceNavBar'
import { StyleProp, ViewStyle } from 'react-native'
import {
  OnboardingSheetRef,
  OnboardingSheetWrapper,
} from '@features/onboarding/OnboardingSheet'

const PairLedgerPage = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const onboardingSheetRef = useRef<OnboardingSheetRef>(null)
  const { bottom } = useSafeAreaInsets()

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

  const openOnboardingSheet = useCallback(() => {
    onboardingSheetRef.current?.show('ledger')
  }, [onboardingSheetRef])

  return (
    <ScrollBox
      contentContainerStyle={contentContainerStyle as StyleProp<ViewStyle>}
    >
      <ImageBox
        source={require('@assets/images/ledger.png')}
        marginBottom="3xl"
      />
      <Text variant="displayMdSemibold" color="primaryText" marginBottom="xl">
        {t('PairLedgerPage.title')}
      </Text>
      <Text
        variant="textXlRegular"
        color="text.quaternary-500"
        textAlign="center"
        marginBottom="3xl"
      >
        {t('PairLedgerPage.subtitle')}
      </Text>
      <ButtonPressable
        title={t('PairLedgerPage.scanForLedger')}
        backgroundColor="primaryText"
        titleColor="primaryBackground"
        width={265.06}
        LeadingComponent={
          <Bluetooth
            width={12.65}
            height={17.98}
            color={colors.primaryBackground}
          />
        }
        onPress={openOnboardingSheet}
      />
      <OnboardingSheetWrapper ref={onboardingSheetRef} />
    </ScrollBox>
  )
}

export default PairLedgerPage
