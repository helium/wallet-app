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
import IndeterminateProgressBar from '@components/IndeterminateProgressBar'
import { useAccountStorage } from '@storage/AccountStorageProvider'

export const ClaimingRewardsModal = () => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const edges = useMemo(() => ['bottom'] as Edge[], [])

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
            <IndeterminateProgressBar paddingHorizontal="l" />
          </Box>
        </SafeAreaBox>
      </ReAnimatedBlurBox>
    </Portal>
  )
}
