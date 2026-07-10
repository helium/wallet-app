import Box from '@components/Box'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import WorldButton from './WorldButton'

// The single path-choice screen for the migration flow: pick the managed email
// route or connect a wallet you already control. This is the only "welcome" the
// flow shows — the launcher modal hands straight off to here.
const IntroStep: FC<{
  onContinue: () => void
  onUseOwnWallet: () => void
  onDismiss: () => void
}> = ({ onContinue, onUseOwnWallet, onDismiss }) => {
  const { t } = useTranslation()
  return (
    <Box
      flex={1}
      justifyContent="space-between"
      paddingHorizontal="l"
      paddingBottom="l"
    >
      <Box flex={1} justifyContent="center">
        <Text variant="h1" color="worldInk" textAlign="center">
          {t('migrateToWorldModal.choosePath.title')}
        </Text>

        <Box marginTop="xl">
          <WorldButton
            variant="primary"
            title={t('migrateToWorldModal.choosePath.emailTitle')}
            onPress={onContinue}
          />
          <Text
            variant="body3"
            fontSize={11}
            lineHeight={15}
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
            fontSize={11}
            lineHeight={15}
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
