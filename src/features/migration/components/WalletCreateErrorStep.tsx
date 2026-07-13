import Text from '@components/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { SUPPORT_URL } from '../constants'
import OutcomeStep from './OutcomeStep'

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
    <OutcomeStep
      title={t('migrateToWorld.createWallet.errorTitle')}
      body={t('migrateToWorld.createWallet.errorBody')}
      primaryTitle={t('migrateToWorld.createWallet.retry')}
      onPrimary={onRetry}
      secondaryAction={
        showSupport
          ? {
              title: t('migrateToWorld.createWallet.support'),
              onPress: () => Linking.openURL(SUPPORT_URL),
            }
          : undefined
      }
      onDismiss={onDismiss}
      dismissTitle={t('migrateToWorld.intro.later')}
    >
      {showSupport ? (
        <Text
          variant="body3"
          color="secondaryText"
          textAlign="center"
          marginTop="m"
        >
          {t('migrateToWorld.createWallet.supportBody')}
        </Text>
      ) : null}
    </OutcomeStep>
  )
}

export default WalletCreateErrorStep
