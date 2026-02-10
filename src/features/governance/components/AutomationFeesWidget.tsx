import Box from '@components/Box'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import { Platform, Switch } from 'react-native'
import { useColors } from '@theme/themeHooks'
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
  const { primaryText, primaryBackground } = useColors()

  return (
    <Box
      backgroundColor="surfaceSecondary"
      borderRadius="l"
      padding="m"
      marginTop="m"
      marginBottom="m"
    >
      <Box
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        marginBottom="s"
      >
        <Box flex={1}>
          <Text variant="body2" color="grey400">
            {t('gov.automation.enableAutomation')}
          </Text>
        </Box>
        <Switch
          value={automationEnabled}
          onValueChange={onSetAutomationEnabled}
          thumbColor={
            Platform.OS === 'android' ? primaryText : primaryBackground
          }
          style={
            Platform.OS === 'android'
              ? undefined
              : {
                  transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
                  marginRight: -8,
                }
          }
        />
      </Box>
      {estimatedSolFee && (
        <Box
          flexDirection="row"
          justifyContent="space-between"
          marginBottom="s"
        >
          <Text variant="body2" color="grey400">
            {t('gov.automation.estimatedFee')}
          </Text>
          <Text variant="body2Medium" color="grey200">
            {estimatedSolFee} SOL
          </Text>
        </Box>
      )}
    </Box>
  )
}
