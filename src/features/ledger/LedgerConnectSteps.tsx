import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import Check from '@assets/images/checkmark.svg'
import InfoError from '@assets/images/infoError.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors } from '@theme/themeHooks'

interface LedgerConnectStepsProps {
  onLayout?: (event: LayoutChangeEvent) => void
  onRetry: () => void
}

interface StepItemProps {
  step: string
  index: number
  iconColor: string
}

const StepItem = memo(({ step, index, iconColor }: StepItemProps) => (
  <Box
    flexDirection="row"
    marginVertical="m"
    alignItems="center"
    accessibilityRole="text"
    accessibilityLabel={`Step ${index + 1}: ${step}`}
  >
    <Check
      color={iconColor}
      height={24}
      width={24}
      accessibilityLabel="Completed step"
    />
    <Text variant="subtitle2" marginLeft="ms" flex={1}>
      {step}
    </Text>
  </Box>
))

StepItem.displayName = 'StepItem'

const LedgerConnectSteps = ({ onLayout, onRetry }: LedgerConnectStepsProps) => {
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const steps = useMemo<string[]>(
    () => t('ledger.connectError.steps', { returnObjects: true }),
    [t],
  )

  const translations = useMemo(
    () => ({
      title: t('ledger.connectError.title'),
      subtitle: t('ledger.connectError.subtitle'),
      tryAgain: t('generic.tryAgain'),
    }),
    [t],
  )

  const handleRetry = useCallback(() => {
    onRetry()
  }, [onRetry])

  return (
    <Box
      onLayout={onLayout}
      marginHorizontal="l"
      accessibilityRole="alert"
      accessibilityLabel="Ledger connection error steps"
    >
      <Box alignSelf="center" marginVertical="l">
        <InfoError accessibilityLabel="Error icon" />
      </Box>

      <Text
        variant="h1"
        color="primaryText"
        textAlign="center"
        accessibilityRole="header"
      >
        {translations.title}
      </Text>

      <Text
        variant="subtitle2"
        color="grey300"
        textAlign="center"
        marginBottom="m"
      >
        {translations.subtitle}
      </Text>

      <Box marginVertical="s">
        {steps.map((step, index) => (
          <StepItem
            key={step}
            step={step}
            index={index}
            iconColor={primaryText}
          />
        ))}
      </Box>

      <TouchableOpacityBox
        marginTop="s"
        marginBottom="l"
        onPress={handleRetry}
        backgroundColor="surface"
        padding="l"
        borderRadius="round"
        accessibilityRole="button"
        accessibilityLabel={`${translations.tryAgain} button`}
        accessibilityHint="Double tap to retry connecting to your Ledger device"
      >
        <Text variant="subtitle1" textAlign="center">
          {translations.tryAgain}
        </Text>
      </TouchableOpacityBox>
    </Box>
  )
}

export default memo(LedgerConnectSteps)
