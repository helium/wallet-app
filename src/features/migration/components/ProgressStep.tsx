import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

const ProgressStep: FC<{ label: string }> = ({ label }) => {
  const { t } = useTranslation()
  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      paddingHorizontal="l"
    >
      <CircleLoader loaderSize={40} color="worldPurple" />
      <Text variant="h4" color="primaryText" marginTop="l">
        {t('migrateToWorld.migrating.title')}
      </Text>
      <Text variant="body3" color="secondaryText" marginTop="m">
        {t('migrateToWorld.migrating.walletReady')}
      </Text>
      <Text variant="body3" color="secondaryText" marginTop="xs">
        {label}
      </Text>
    </Box>
  )
}

export default ProgressStep
