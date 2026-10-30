import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { Check } from 'lucide-react-native'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'

const CheckIcon = withUniwind(Check)

const ProgressStep: FC<{ label: string }> = ({ label }) => {
  const { t } = useTranslation()
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Spinner size="large" />
      <Text size="2xl" className="mt-6 tracking-tight">
        {t('migrateToWorld.migrating.title')}
      </Text>

      <View className="mt-6 flex-row items-center gap-1 rounded-full bg-success-50 px-4 py-1">
        <CheckIcon
          size={12}
          strokeWidth={3}
          colorClassName="accent-success-700"
        />
        <Text size="xs" className="font-bold text-success-700">
          {t('migrateToWorld.migrating.walletReady')}
        </Text>
      </View>

      {/* Fixed-height slot so the batch pill appearing/disappearing between
          batches doesn't shift the stack mid-migration. */}
      <View className="mt-2 h-[34px] justify-center">
        {label ? (
          <View className="rounded-full border border-border bg-secondary px-4 py-1">
            <Text size="xs" className="font-medium text-muted-foreground">
              {label}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export default ProgressStep
