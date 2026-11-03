import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// The single path-choice screen for the migration flow: pick the managed email
// route or connect a wallet you already control. This is the only "welcome" the
// flow shows — the launcher card hands straight off to here.
const IntroStep: FC<{
  onContinue: () => void
  onUseOwnWallet: () => void
  onDismiss: () => void
}> = ({ onContinue, onUseOwnWallet, onDismiss }) => {
  const { t } = useTranslation()
  const { top } = useSafeAreaInsets()
  return (
    <View
      className="flex-1 justify-between px-6 pb-6"
      style={{ paddingTop: top }}
    >
      <View className="flex-1 justify-center">
        <Text size="2xl" className="text-center tracking-tight">
          {t('migrateToWorldModal.choosePath.title')}
        </Text>
        <Text className="mt-2 text-center text-muted-foreground">
          {t('migrateToWorldModal.choosePath.subtitle')}
        </Text>

        <View className="mt-8">
          <Button
            variant="cta"
            size="dashboard"
            className="w-full"
            onPress={onContinue}
            testID="MigrateIntro.Email"
          >
            {t('migrateToWorldModal.choosePath.emailTitle')}
          </Button>
          <Text
            size="xs"
            className="mt-2 px-6 text-center text-muted-foreground"
          >
            {t('migrateToWorldModal.choosePath.emailBody')}
          </Text>
        </View>

        <View className="mt-6">
          <Button
            variant="outline"
            size="dashboard"
            className="w-full"
            onPress={onUseOwnWallet}
          >
            {t('migrateToWorldModal.choosePath.selfCustodyTitle')}
          </Button>
          <Text
            size="xs"
            className="mt-2 px-6 text-center text-muted-foreground"
          >
            {t('migrateToWorldModal.choosePath.selfCustodyBody')}
          </Text>
        </View>
      </View>

      <Button
        variant="ghost"
        size="dashboard"
        className="w-full"
        onPress={onDismiss}
      >
        {t('migrateToWorld.intro.later')}
      </Button>
    </View>
  )
}

export default IntroStep
