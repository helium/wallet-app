import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import OutcomeStep from './OutcomeStep'

const PendingStep: FC<{
  movedCount: number
  onCheckStatus: () => void
  onDismiss: () => void
}> = ({ movedCount, onCheckStatus, onDismiss }) => {
  const { t } = useTranslation()
  return (
    <OutcomeStep
      title={t('migrateToWorld.pending.title')}
      body={t('migrateToWorld.pending.body', { moved: movedCount })}
      primaryTitle={t('migrateToWorld.pending.checkStatus')}
      onPrimary={onCheckStatus}
      onDismiss={onDismiss}
    />
  )
}

export default PendingStep
