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

export const ClaimingRewardsModal = ({ status }: { status?: Status }) => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const edges = useMemo(() => ['bottom'] as Edge[], [])
  const { helpText, percent } = useMemo(() => {
    if (!status) return { helpText: 'Preparing Transactions...', percent: 0 }
    const { totalTxs, totalProgress, currentBatchSize } = status

    const remainingTxs = totalTxs - totalProgress
    const actualBatchSize =
      totalTxs < currentBatchSize ? totalTxs : currentBatchSize

    return {
      helpText: `Sending batch of ${actualBatchSize} transactions.\n${remainingTxs} total transaction${
        remainingTxs > 1 ? '2' : ''
      } remaining.`,
      percent: (totalProgress * 100) / totalTxs,
    }
  }, [status])

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
          padding="4"
          marginHorizontal="2"
          marginVertical="xs"
        >
          <Box flexGrow={1} justifyContent="center" alignItems="center">
            <Box
              shadowColor="base.black"
              shadowOpacity={0.4}
              shadowOffset={{ width: 0, height: 10 }}
              shadowRadius={10}
              elevation={12}
            >
              <AccountIcon address={currentAccount?.solanaAddress} size={76} />
            </Box>
            <Text
              textAlign="left"
              variant="textLgMedium"
              adjustsFontSizeToFit
              marginTop="4"
              marginBottom="3"
            >
              {t('gov.claiming.title')}
            </Text>
            <Box paddingHorizontal="6" marginBottom="4">
              <Text
                variant="textSmMedium"
                color="secondaryText"
                marginBottom="2"
                textAlign="center"
              >
                {t('gov.claiming.body')}
              </Text>
              <Text
                variant="textSmMedium"
                color="orange.500"
                textAlign="center"
              >
                {t('gov.claiming.multiple')}
              </Text>
            </Box>

            <Box alignItems="center" marginTop="4">
              <Box flexDirection="row">
                <ProgressBar progress={percent} />
              </Box>
              <Text
                variant="textSmRegular"
                color="secondaryText"
                marginTop="2"
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
