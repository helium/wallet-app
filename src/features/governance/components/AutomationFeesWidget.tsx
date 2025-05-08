import Box from '@components/Box'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import { Platform, Switch } from 'react-native'
import { useColors } from '@theme/themeHooks'
import React from 'react'

type Props = {
  automationEnabled: boolean
  onSetAutomationEnabled: (enabled: boolean) => void
  solFees: number
  prepaidTxFees: number
}

export const AutomationFeesWidget = ({
  automationEnabled,
  onSetAutomationEnabled,
  solFees,
  prepaidTxFees,
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
      <Box
        flexDirection="row"
        justifyContent="space-between"
        marginBottom="s"
      >
        <Text variant="body2" color="grey400">
          {t('gov.automation.rentFees')}
        </Text>
        <Text variant="body2Medium" color="grey200">
          {solFees.toFixed(6)} SOL
        </Text>
      </Box>
      <Box
        flexDirection="row"
        justifyContent="space-between"
        marginBottom="s"
      >
        <Text variant="body2" color="grey400">
          {t('gov.automation.prepaidTxFees')}
        </Text>
        <Text variant="body2Medium" color="grey200">
          {prepaidTxFees.toFixed(6)} SOL
        </Text>
      </Box>
    </Box>
  )
} 