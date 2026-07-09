import Box from '@components/Box'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import WorldButton from './WorldButton'

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
        <Text variant="h1" color="primaryText" textAlign="center">
          {t('migrateToWorld.intro.title')}
        </Text>
        <Text
          variant="body1"
          color="secondaryText"
          textAlign="center"
          marginTop="l"
        >
          {t('migrateToWorld.intro.body')}
        </Text>
      </Box>
      <Box>
        <WorldButton
          title={t('migrateToWorld.intro.continue')}
          onPress={onContinue}
          marginBottom="m"
        />
        <WorldButton
          variant="secondary"
          titleColor="worldPurple"
          title={t('migrateToWorld.intro.useOwnWallet')}
          onPress={onUseOwnWallet}
          marginBottom="xs"
        />
        <WorldButton
          variant="secondary"
          title={t('migrateToWorld.intro.later')}
          onPress={onDismiss}
        />
      </Box>
    </Box>
  )
}

export default IntroStep
