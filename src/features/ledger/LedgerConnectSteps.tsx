import React from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, View } from 'react-native'
import { Check, CircleX } from 'lucide-react-native'
import { withUniwind } from 'uniwind'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import type { ScanErrorKind } from '@hooks/useLedgerDeviceScan'

const CheckIcon = withUniwind(Check)
const CircleXIcon = withUniwind(CircleX)

interface LedgerConnectStepsProps {
  onLayout?: (event: LayoutChangeEvent) => void
  onRetry: () => void
  errorKind?: ScanErrorKind
}

interface StepItemProps {
  step: string
  index: number
}

const StepItem = ({ step, index }: StepItemProps) => (
  <View
    className="my-4 flex-row items-center"
    accessibilityRole="text"
    accessibilityLabel={`Step ${index + 1}: ${step}`}
  >
    <CheckIcon
      size={24}
      colorClassName="accent-foreground"
      accessibilityLabel="Completed step"
    />
    <Text size="lg" className="ml-3 flex-1 font-medium">
      {step}
    </Text>
  </View>
)

const LedgerConnectSteps = ({
  onLayout,
  onRetry,
  errorKind,
}: LedgerConnectStepsProps) => {
  const { t } = useTranslation()
  const steps = t('ledger.connectError.steps', {
    returnObjects: true,
  }) as string[]

  // Bluetooth-off and permission errors have their own copy and no steps
  const hasSpecificCopy =
    errorKind === 'bluetoothOff' || errorKind === 'permission'
  const translations = {
    title: hasSpecificCopy
      ? t(`ledger.connectError.${errorKind}.title`)
      : t('ledger.connectError.title'),
    subtitle: hasSpecificCopy
      ? t(`ledger.connectError.${errorKind}.subtitle`)
      : t('ledger.connectError.subtitle'),
    tryAgain: t('generic.tryAgain'),
  }

  const handleRetry = () => {
    onRetry()
  }

  return (
    <View
      onLayout={onLayout}
      className="mx-6"
      accessibilityRole="alert"
      accessibilityLabel="Ledger connection error steps"
    >
      <View className="my-6 self-center">
        <CircleXIcon
          size={64}
          colorClassName="accent-destructive"
          accessibilityLabel="Error icon"
        />
      </View>

      <Text size="4xl" className="text-center" accessibilityRole="header">
        {translations.title}
      </Text>

      <Text
        size="lg"
        className="mb-4 text-center font-medium text-muted-foreground"
      >
        {translations.subtitle}
      </Text>

      <View className="my-2">
        {!hasSpecificCopy &&
          steps.map((step, index) => (
            <StepItem key={step} step={step} index={index} />
          ))}
      </View>

      <Button
        variant="secondary"
        size="lg"
        className="mb-6 mt-2 w-full"
        onPress={handleRetry}
        accessibilityRole="button"
        accessibilityLabel={`${translations.tryAgain} button`}
        accessibilityHint="Double tap to retry connecting to your Ledger device"
      >
        {translations.tryAgain}
      </Button>
    </View>
  )
}

export default LedgerConnectSteps
