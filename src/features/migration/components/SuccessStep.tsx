import Text from '@components/Text'
import { shortenAddress } from '@utils/formatting'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import OutcomeStep from './OutcomeStep'

const SuccessStep: FC<{
  destinationWallet: string
  onGoToWorld: () => void
  onDone: () => void
}> = ({ destinationWallet, onGoToWorld, onDone }) => {
  const { t } = useTranslation()
  return (
    <OutcomeStep
      title={t('migrateToWorld.success.title')}
      body={t('migrateToWorld.success.body')}
      primaryTitle={t('migrateToWorld.success.goToWorld')}
      onPrimary={onGoToWorld}
      onDismiss={onDone}
    >
      <Text
        variant="body3"
        color="secondaryText"
        textAlign="center"
        marginTop="s"
      >
        {t('migrateToWorld.success.wallet', {
          address: shortenAddress(destinationWallet, 6),
        })}
      </Text>
    </OutcomeStep>
  )
}

export default SuccessStep
