import Box from '@components/Box'
import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { SUPPORT_URL } from '../constants'
import WorldButton from './WorldButton'

// Shown when the Privy embedded (destination) wallet fails to create. Without a
// destination the migration cannot proceed, so the only paths are Retry and,
// after repeated failures, a support link.
const WalletCreateErrorStep: FC<{
  onRetry: () => void
  onDismiss: () => void
  showSupport: boolean
}> = ({ onRetry, onDismiss, showSupport }) => {
  const { t } = useTranslation()
  return (
    <Box flex={1} justifyContent="center" paddingHorizontal="l">
      <Text variant="h4" color="primaryText" textAlign="center">
        {t('migrateToWorld.createWallet.errorTitle')}
      </Text>
      <Text
        variant="body2"
        color="secondaryText"
        textAlign="center"
        marginTop="m"
      >
        {t('migrateToWorld.createWallet.errorBody')}
      </Text>
      {showSupport && (
        <Text
          variant="body3"
          color="secondaryText"
          textAlign="center"
          marginTop="m"
        >
          {t('migrateToWorld.createWallet.supportBody')}
        </Text>
      )}
      <WorldButton
        title={t('migrateToWorld.createWallet.retry')}
        onPress={onRetry}
        marginTop="xl"
        marginBottom="m"
      />
      {showSupport && (
        <WorldButton
          variant="secondary"
          title={t('migrateToWorld.createWallet.support')}
          onPress={() => Linking.openURL(SUPPORT_URL)}
          marginBottom="m"
        />
      )}
      <WorldButton
        variant="secondary"
        title={t('migrateToWorld.intro.later')}
        onPress={onDismiss}
      />
    </Box>
  )
}

export default WalletCreateErrorStep
