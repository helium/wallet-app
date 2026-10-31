import { Text } from '@ui/Text'
import { useTranslation } from 'react-i18next'
import { Platform, Switch, View } from 'react-native'
import React from 'react'

type Props = {
  automationEnabled: boolean
  onSetAutomationEnabled: (enabled: boolean) => void
  estimatedSolFee?: string
}

export const AutomationFeesWidget = ({
  automationEnabled,
  onSetAutomationEnabled,
  estimatedSolFee,
}: Props) => {
  const { t } = useTranslation()

  return (
    <View className="my-4 rounded-[12px] bg-card p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-muted-foreground">
            {t('gov.automation.enableAutomation')}
          </Text>
        </View>
        <Switch
          value={automationEnabled}
          onValueChange={onSetAutomationEnabled}
          style={
            Platform.OS === 'android'
              ? undefined
              : {
                  transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
                  marginRight: -8,
                }
          }
        />
      </View>
      <View className="mb-2 flex-row justify-between">
        <Text className="text-muted-foreground">
          {t('gov.automation.estimatedFee')}
        </Text>
        <Text className="font-medium">
          {estimatedSolFee ? `${estimatedSolFee} SOL` : '-- SOL'}
        </Text>
      </View>
    </View>
  )
}
