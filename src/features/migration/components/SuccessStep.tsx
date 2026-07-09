import Box from '@components/Box'
import Text from '@components/Text'
import { shortenAddress } from '@utils/formatting'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import WorldButton from './WorldButton'

const SuccessStep: FC<{
  destinationWallet: string
  onGoToWorld: () => void
  onDone: () => void
}> = ({ destinationWallet, onGoToWorld, onDone }) => {
  const { t } = useTranslation()
  return (
    <Box flex={1} justifyContent="center" paddingHorizontal="l">
      <Text
        variant="h4"
        color="primaryText"
        textAlign="center"
        marginBottom="m"
      >
        {t('migrateToWorld.success.title')}
      </Text>
      <Text
        variant="body2"
        color="secondaryText"
        textAlign="center"
        marginBottom="s"
      >
        {t('migrateToWorld.success.body')}
      </Text>
      <Text
        variant="body3"
        color="secondaryText"
        textAlign="center"
        marginBottom="xl"
      >
        {t('migrateToWorld.success.wallet', {
          address: shortenAddress(destinationWallet, 6),
        })}
      </Text>
      <WorldButton
        title={t('migrateToWorld.success.goToWorld')}
        onPress={onGoToWorld}
        marginBottom="m"
      />
      <WorldButton
        variant="secondary"
        title={t('migrateToWorldModal.dismiss')}
        onPress={onDone}
      />
    </Box>
  )
}

export default SuccessStep
