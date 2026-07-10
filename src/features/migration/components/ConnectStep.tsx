import Box from '@components/Box'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, ScrollView } from 'react-native'
import { WORLD_URL } from '../constants'
import StepBackHeader from './StepBackHeader'
import WorldButton from './WorldButton'

// Guided, branched instructions to connect an existing external wallet as the
// World destination via World Explorer's wallet-standard / SIWS connect model.
// No keys are exported and no funds move here — the user just signs in with a
// wallet they already control. Hardware-wallet users are routed here too.
// A numbered instruction row: "1." gutter + the step text, both in the
// secondary World-Light body styling used across this screen.
const StepRow: FC<{ index: number; text: string }> = ({ index, text }) => (
  <Box flexDirection="row" marginTop="s">
    <Text variant="body2" color="secondaryText" lineHeight={22} marginRight="s">
      {`${index}.`}
    </Text>
    <Text variant="body2" color="secondaryText" lineHeight={22} flex={1}>
      {text}
    </Text>
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
          <Text variant="h4" color="primaryText">
            {t('migrateToWorld.connect.title')}
          </Text>
          <Text
            variant="body2"
            color="secondaryText"
            marginTop="xs"
            lineHeight={22}
          >
            {t('migrateToWorld.connect.reassurance')}
          </Text>

          <Box marginTop="xl">
            <Text variant="subtitle2" color="primaryText">
              {t('migrateToWorld.connect.softwareTitle')}
            </Text>
            {softwareSteps.map((step, i) => (
              <StepRow key={step} index={i + 1} text={step} />
            ))}
          </Box>

          <Box
            marginTop="xl"
            borderTopColor="primaryBackground"
            borderTopWidth={1}
            paddingTop="l"
          >
            <Text variant="subtitle2" color="primaryText">
              {t('migrateToWorld.connect.hardwareTitle')}
            </Text>
            {hardwareSteps.map((step, i) => (
              <StepRow key={step} index={i + 1} text={step} />
            ))}
          </Box>
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
