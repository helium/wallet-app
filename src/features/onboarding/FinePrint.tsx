import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, View } from 'react-native'
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../constants/urls'

// The terms-of-service and privacy-policy line under the onboarding choices.
const FinePrint = ({ className }: { className?: string }) => {
  const { t } = useTranslation()
  return (
    <View className={twMerge('flex-row flex-wrap', className)}>
      <Text className="text-navy-foreground/50">{t('finePrint.body')} </Text>
      <PressableScale
        feedback="opacity"
        onPress={() =>
          void Linking.openURL(TERMS_OF_SERVICE).catch(console.error)
        }
      >
        <Text className="text-purple-400">
          {t('settings.sections.finePrint.termsOfService')}{' '}
        </Text>
      </PressableScale>
      <Text className="text-navy-foreground/50">{t('generic.and')} </Text>
      <PressableScale
        feedback="opacity"
        onPress={() =>
          void Linking.openURL(PRIVACY_POLICY).catch(console.error)
        }
      >
        <Text className="text-purple-400">
          {t('settings.sections.finePrint.privacyPolicy')}
        </Text>
      </PressableScale>
      <Text className="text-navy-foreground/50">{t('generic.period')}</Text>
    </View>
  )
}

export default FinePrint
