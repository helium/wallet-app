import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

const ProgressStep: FC<{ walletReady: boolean; label: string }> = ({
  walletReady,
  label,
}) => {
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
        {walletReady
          ? `✓ ${t('migrateToWorld.migrating.walletReady')}`
          : t('migrateToWorld.migrating.creatingWallet')}
      </Text>
      <Text variant="body3" color="secondaryText" marginTop="xs">
        {label}
      </Text>
    </Box>
  )
}

export default ProgressStep
