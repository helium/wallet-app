import { Text } from '@ui/Text'
import { shortenAddress } from '@utils/formatting'
import { CircleCheck } from 'lucide-react-native'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import OutcomeStep from './OutcomeStep'

const SuccessIcon = withUniwind(CircleCheck)

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
      dismissTitle={t('migrateToWorld.nothingToMigrate.done')}
      icon={<SuccessIcon size={56} colorClassName="accent-success-700" />}
    >
      <View className="mt-4 self-center rounded-full border border-border bg-secondary px-4 py-2">
        <Text size="xs" className="font-medium">
          {t('migrateToWorld.success.wallet', {
            address: shortenAddress(destinationWallet, 6),
          })}
        </Text>
      </View>
    </OutcomeStep>
  )
}

export default SuccessStep
