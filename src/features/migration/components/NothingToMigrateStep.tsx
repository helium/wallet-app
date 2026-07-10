import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import OutcomeStep from './OutcomeStep'

const NothingToMigrateStep: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useTranslation()
  return (
    <OutcomeStep
      title={t('migrateToWorld.nothingToMigrate.title')}
      body={t('migrateToWorld.nothingToMigrate.body')}
      primaryTitle={t('migrateToWorld.nothingToMigrate.done')}
      onPrimary={onDone}
    />
  )
}

export default NothingToMigrateStep
