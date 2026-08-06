import Box from '@components/Box'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WORLD_TRACKING } from '../migrationTheme'
import WorldButton from './WorldButton'

// The single path-choice screen for the migration flow: pick the managed email
// route or connect a wallet you already control. This is the only "welcome" the
// flow shows — the launcher card hands straight off to here.
const IntroStep: FC<{
  onContinue: () => void
  onUseOwnWallet: () => void
  onDismiss: () => void
}> = ({ onContinue, onUseOwnWallet, onDismiss }) => {
  const { t } = useTranslation()
  const { top } = useSafeAreaInsets()
  return (
    <Box
      flex={1}
      justifyContent="space-between"
      paddingHorizontal="l"
      paddingBottom="l"
      style={{ paddingTop: top }}
    >
      <Box flex={1} justifyContent="center">
        <Text
          variant="h3"
          color="worldInk"
          letterSpacing={WORLD_TRACKING.hero}
          textAlign="center"
        >
          {t('migrateToWorldModal.choosePath.title')}
        </Text>
        <Text
          variant="body2"
          color="worldSecondaryInk"
          textAlign="center"
          marginTop="s"
        >
          {t('migrateToWorldModal.choosePath.subtitle')}
        </Text>

        <Box marginTop="xl">
          <WorldButton
            variant="primary"
            title={t('migrateToWorldModal.choosePath.emailTitle')}
            onPress={onContinue}
          />
          <Text
            variant="body3"
            lineHeight={16}
            color="worldSecondaryInk"
            textAlign="center"
            marginTop="s"
            paddingHorizontal="l"
          >
            {t('migrateToWorldModal.choosePath.emailBody')}
          </Text>
        </Box>

        <Box marginTop="l">
          <WorldButton
            variant="outline"
            title={t('migrateToWorldModal.choosePath.selfCustodyTitle')}
            onPress={onUseOwnWallet}
          />
          <Text
            variant="body3"
            lineHeight={16}
            color="worldSecondaryInk"
            textAlign="center"
            marginTop="s"
            paddingHorizontal="l"
          >
            {t('migrateToWorldModal.choosePath.selfCustodyBody')}
          </Text>
        </Box>
      </Box>

      <WorldButton
        variant="ghost"
        title={t('migrateToWorld.intro.later')}
        onPress={onDismiss}
      />
    </Box>
  )
}

export default IntroStep
