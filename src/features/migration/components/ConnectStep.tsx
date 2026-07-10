import Box from '@components/Box'
import Text from '@components/Text'
import React, { FC, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, ScrollView } from 'react-native'
import { WORLD_URL } from '../constants'
import StepBackHeader from './StepBackHeader'
import WorldButton from './WorldButton'

// Guided, branched instructions to connect an existing external wallet as the
// World destination via World Explorer's wallet-standard / SIWS connect model.
// No keys are exported and no funds move here — the user just signs in with a
// wallet they already control. Hardware-wallet users are routed here too.
// A numbered instruction row: a small World-purple numeral badge + the step
// text, in the secondary World-Light body styling used across this screen.
const StepRow: FC<{ index: number; text: string }> = ({ index, text }) => (
  <Box flexDirection="row" marginTop="m" alignItems="flex-start">
    <Box
      width={24}
      height={24}
      borderRadius="round"
      backgroundColor="worldAccentBg"
      alignItems="center"
      justifyContent="center"
      marginRight="s"
    >
      <Text variant="body3" color="worldPurple" fontWeight="700">
        {index}
      </Text>
    </Box>
    <Text
      variant="body2"
      color="worldSecondaryInk"
      lineHeight={22}
      flex={1}
      marginTop="xxs"
    >
      {text}
    </Text>
  </Box>
)

// A titled instruction card grouping one connection route's steps.
const StepCard: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <Box backgroundColor="grey100" borderRadius="xl" padding="l" marginTop="m">
    <Text variant="subtitle2" color="worldInk">
      {title}
    </Text>
    {children}
  </Box>
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
    <Box flex={1}>
      <StepBackHeader onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Box paddingHorizontal="l">
          <Text variant="h4" color="worldInk">
            {t('migrateToWorld.connect.title')}
          </Text>
          <Text
            variant="body2"
            color="worldSecondaryInk"
            marginTop="xs"
            lineHeight={22}
          >
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
        </Box>
      </ScrollView>
      <Box paddingHorizontal="l" paddingBottom="m">
        <WorldButton
          title={t('migrateToWorld.connect.openWorld')}
          onPress={() => Linking.openURL(WORLD_URL)}
        />
        {onDismiss ? (
          <WorldButton
            variant="dismiss"
            title={t('migrateToWorldModal.dismiss')}
            onPress={onDismiss}
            marginTop="s"
          />
        ) : null}
      </Box>
    </Box>
  )
}

export default ConnectStep
