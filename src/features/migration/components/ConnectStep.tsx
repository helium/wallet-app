import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import React, { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, ScrollView, View } from 'react-native'
import { WORLD_URL } from '../constants'
import StepBackHeader from './StepBackHeader'

// Guided, branched instructions to connect an existing external wallet as the
// World destination via World Explorer's wallet-standard / SIWS connect model.
// No keys are exported and no funds move here — the user just signs in with a
// wallet they already control. Hardware-wallet users are routed here too.
// A numbered instruction row: a small World-purple numeral badge + the step
// text, in the secondary body styling used across this screen.
const StepRow: FC<{ index: number; text: string }> = ({ index, text }) => (
  <View className="mt-4 flex-row items-start">
    <View className="mr-2 size-6 items-center justify-center rounded-full bg-purple-50">
      <Text size="xs" className="font-bold text-purple-700">
        {index}
      </Text>
    </View>
    <Text className="mt-0.5 flex-1 leading-[22px] text-muted-foreground">
      {text}
    </Text>
  </View>
)

// A titled instruction card grouping one connection route's steps.
const StepCard: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <View className="mt-4 rounded-[20px] border border-border bg-secondary p-6">
    <Text size="lg" className="font-medium">
      {title}
    </Text>
    {children}
  </View>
)

const ConnectStep: FC<{ onBack: () => void; onDismiss?: () => void }> = ({
  onBack,
  onDismiss,
}) => {
  const { t } = useTranslation()

  const softwareSteps = [
    t('migrateToWorld.connect.softwareStep1'),
    t('migrateToWorld.connect.softwareStep2'),
    t('migrateToWorld.connect.softwareStep3'),
  ]
  const hardwareSteps = [
    t('migrateToWorld.connect.hardwareStep1'),
    t('migrateToWorld.connect.hardwareStep2'),
    t('migrateToWorld.connect.hardwareStep3'),
    t('migrateToWorld.connect.hardwareStep4'),
  ]

  return (
    <View className="flex-1">
      <StepBackHeader onBack={onBack} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-8"
      >
        <View className="px-6">
          <Text size="xl" className="tracking-tight">
            {t('migrateToWorld.connect.title')}
          </Text>
          <Text className="mt-1 leading-[22px] text-muted-foreground">
            {t('migrateToWorld.connect.reassurance')}
          </Text>

          <StepCard title={t('migrateToWorld.connect.softwareTitle')}>
            {softwareSteps.map((step, i) => (
              <StepRow key={step} index={i + 1} text={step} />
            ))}
          </StepCard>

          <StepCard title={t('migrateToWorld.connect.hardwareTitle')}>
            {hardwareSteps.map((step, i) => (
              <StepRow key={step} index={i + 1} text={step} />
            ))}
          </StepCard>
        </View>
      </ScrollView>
      <View className="px-6 pb-6">
        <Button
          variant="cta"
          size="lg"
          className="w-full"
          onPress={() => void Linking.openURL(WORLD_URL).catch(console.error)}
        >
          {t('migrateToWorld.connect.openWorld')}
        </Button>
        {onDismiss ? (
          <Button
            variant="ghost"
            size="lg"
            className="mt-2 w-full"
            onPress={onDismiss}
          >
            {t('migrateToWorld.intro.later')}
          </Button>
        ) : null}
      </View>
    </View>
  )
}

export default ConnectStep
