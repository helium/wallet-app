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
const ConnectStep: FC<{ onBack: () => void; onDismiss?: () => void }> = ({
  onBack,
  onDismiss,
}) => {
  const { t } = useTranslation()

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
            <Text
              variant="body2"
              color="secondaryText"
              marginTop="xs"
              lineHeight={22}
            >
              {t('migrateToWorld.connect.softwareBody')}
            </Text>
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
            <Text
              variant="body2"
              color="secondaryText"
              marginTop="xs"
              lineHeight={22}
            >
              {t('migrateToWorld.connect.hardwareBody')}
            </Text>
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
