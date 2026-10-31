import { useAccountStorage } from '@storage/AccountStorageProvider'
import { AccountIcon } from '@ui/AccountIcon'
import { Text } from '@ui/Text'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { GovernanceModal } from './components/GovernanceModal'

export const ClaimingRewardsModal = () => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()

  return (
    <GovernanceModal edges={['bottom']}>
      <View className="grow items-center justify-center">
        <View className="shadow-lg">
          <AccountIcon address={currentAccount?.solanaAddress} size={76} />
        </View>
        <Text
          size="xl"
          className="mt-4 mb-3 font-semibold"
          adjustsFontSizeToFit
        >
          {t('gov.claiming.title')}
        </Text>
        <View className="mb-4 px-6">
          <Text className="mb-2 text-center text-muted-foreground">
            {t('gov.claiming.body')}
          </Text>
          <Text className="text-center text-warning-500">
            {t('gov.claiming.multiple')}
          </Text>
        </View>
      </View>
    </GovernanceModal>
  )
}
