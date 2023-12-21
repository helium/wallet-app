import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import { FadeInFast } from '@components/FadeInOut'
import { Portal } from '@gorhom/portal'
import React, { useMemo } from 'react'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import Box from '@components/Box'
import { Edge } from 'react-native-safe-area-context'
import AccountIcon from '@components/AccountIcon'
import { useTranslation } from 'react-i18next'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { Status } from '@helium/spl-utils'
import ProgressBar from '@components/ProgressBar'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'

export const ClaimingRewardsModal = ({
  status,
  positions,
}: {
  status?: Status
  positions?: PositionWithMeta[]
}) => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const edges = useMemo(() => ['bottom'] as Edge[], [])
  const { helpText, percent } = useMemo(() => {
    if (!status) return { helpText: 'Preparing Transactions...', percent: 0 }
    const totalTxns = positions?.length || 0

    return {
      helpText: `Sending batch of ${status.currentBatchSize} transactions.\n${
        totalTxns - status.currentBatchProgress
      } total transactions remaning.`,
      percent: (status.totalProgress * 100) / totalTxns,
    }
  }, [status, positions])

  return (
    <Portal hostName="GovernancePortalHost">
      <ReAnimatedBlurBox
        visible
        entering={FadeInFast}
        position="absolute"
        height="100%"
        width="100%"
      >
        <SafeAreaBox
          edges={edges}
          backgroundColor="transparent"
          flex={1}
          padding="m"
          marginHorizontal="s"
          marginVertical="xs"
        >
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Box
              shadowColor="black"
              shadowOpacity={0.4}
              shadowOffset={{ width: 0, height: 10 }}
              shadowRadius={10}
              elevation={12}
            >
              <AccountIcon address={currentAccount?.solanaAddress} size={76} />
            </Box>
            <Text
              textAlign="left"
              variant="subtitle2"
              adjustsFontSizeToFit
              marginTop="m"
              marginBottom="ms"
            >
              {t('gov.claiming.title')}
            </Text>
            <Text variant="subtitle4" color="secondaryText" marginBottom="m">
              {t('gov.claiming.body')}
            </Text>

            <Box alignItems="center" marginTop="m">
              <Box flexDirection="row">
                <ProgressBar progress={percent} />
              </Box>
              <Text
                variant="body2"
                color="secondaryText"
                marginTop="s"
                textAlign="center"
              >
                {helpText}
              </Text>
            </Box>
          </Box>
        </SafeAreaBox>
      </ReAnimatedBlurBox>
    </Portal>
  )
}
