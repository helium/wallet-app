import Box from '@components/Box'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import WorldButton from './WorldButton'

const NothingToMigrateStep: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useTranslation()
  return (
    <Box flex={1} justifyContent="center" paddingHorizontal="l">
      <Text variant="h4" color="primaryText" textAlign="center">
        {t('migrateToWorld.nothingToMigrate.title')}
      </Text>
      <Text
        variant="body2"
        color="secondaryText"
        textAlign="center"
        marginTop="m"
        marginBottom="xl"
      >
        {t('migrateToWorld.nothingToMigrate.body')}
      </Text>
      <WorldButton
        title={t('migrateToWorld.nothingToMigrate.done')}
        onPress={onDone}
      />
    </Box>
  )
}

export default NothingToMigrateStep
