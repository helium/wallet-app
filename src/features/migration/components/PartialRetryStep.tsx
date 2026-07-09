import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import OutcomeStep from './OutcomeStep'

const PartialRetryStep: FC<{
  movedCount: number
  failedCount: number
  onRetry: () => void
  onDismiss: () => void
}> = ({ movedCount, failedCount, onRetry, onDismiss }) => {
  const { t } = useTranslation()
  return (
    <OutcomeStep
      title={t('migrateToWorld.partial.title')}
      body={t('migrateToWorld.partial.body', {
        moved: movedCount,
        failed: failedCount,
      })}
      primaryTitle={t('migrateToWorld.partial.retry')}
      onPrimary={onRetry}
      onDismiss={onDismiss}
    />
  )
}

export default PartialRetryStep
