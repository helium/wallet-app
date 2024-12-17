import ButtonPressable from '@components/ButtonPressable'
import ImageBox from '@components/ImageBox'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Bluetooth from '@assets/svgs/bluetooth.svg'
import { StyleProp, ViewStyle } from 'react-native'
import {
  OnboardingSheetRef,
  OnboardingSheetWrapper,
} from '@features/onboarding/OnboardingSheet'
import { useBottomSpacing } from '@hooks/useBottomSpacing'

const PairLedgerPage = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const onboardingSheetRef = useRef<OnboardingSheetRef>(null)
  const bottomSpacing = useBottomSpacing()

  const contentContainerStyle = useMemo(
    () => ({
      padding: spacing['2xl'],
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: bottomSpacing,
    }),
    [spacing, bottomSpacing],
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
