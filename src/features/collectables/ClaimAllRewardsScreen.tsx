import React, { useCallback, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import IotReward from '@assets/images/iotRewardIcon.svg'
import MobileReward from '@assets/images/mobileRewardIcon.svg'
import { Edge } from 'react-native-safe-area-context'
import { Ticker } from '@helium/currency'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import useHotspots from '../../hooks/useHotspots'
import BackScreen from '../../components/BackScreen'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { CollectableNavigationProp } from './collectablesTypes'
import ButtonPressable from '../../components/ButtonPressable'
import RewardBG from '../../assets/images/rewardBg.svg'
import { DelayedFadeIn } from '../../components/FadeInOut'

const ClaimAllRewardsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<CollectableNavigationProp>()

  const {
    hotspots,
    claimAllIotRewards: { execute: executeIot },
    claimAllMobileRewards: { execute: executeMobile },
    pendingIotRewards,
    pendingMobileRewards,
  } = useHotspots()

  const title = useMemo(() => {
    return t('collectablesScreen.hotspots.claimAllRewards')
  }, [t])

  const subtitle = useMemo(() => {
    return t('collectablesScreen.hotspots.hotspotCount', {
      count: hotspots.length,
    })
  }, [hotspots.length, t])

  const onClaimRewards = useCallback(async () => {
    navigation.push('ClaimingRewardsScreen')
    await executeIot()
    await executeMobile()
  }, [executeIot, executeMobile, navigation])

  const RewardItem = useCallback((ticker: Ticker, amount: number) => {
    // add a comma to the amount
    const amountToText = amount.toLocaleString()
    return (
      <Box
        paddingVertical="l"
        paddingHorizontal="xl"
        justifyContent="center"
        alignItems="center"
        height={197}
        width={167}
      >
        <Box position="absolute" top={0} right={0} bottom={0} left={0}>
          <RewardBG />
        </Box>

        {ticker === 'MOBILE' ? <MobileReward /> : <IotReward />}
        <Text marginTop="xs" variant="h3Medium">
          {amountToText}
        </Text>
        <Text variant="subtitle3" color="secondaryText">
          {ticker}
        </Text>
      </Box>
    )
  }, [])

  const safeEdges = useMemo(() => ['top'] as Edge[], [])

  return (
    <ReAnimatedBox flex={1} entering={DelayedFadeIn}>
      <BackScreen
        headerTopMargin="l"
        title={title}
        paddingVertical="none"
        paddingHorizontal="m"
        edges={safeEdges}
      >
        <Box flexGrow={1}>
          <Box flexGrow={2} alignItems="center">
            <Box flexGrow={1}>
              <Text variant="body2" color="secondaryText">
                {subtitle}
              </Text>
            </Box>
            <Text variant="h3Medium" textAlign="center" marginBottom="xl">
              {t('collectablesScreen.hotspots.hotspotsClaimMessage')}
            </Text>
          </Box>
          <Box
            flexGrow={1}
            alignItems="center"
            justifyContent={
              pendingMobileRewards > 0 && pendingIotRewards > 0
                ? 'space-between'
                : 'center'
            }
            flexDirection="row"
          >
            {pendingMobileRewards > 0 &&
              RewardItem('MOBILE', pendingMobileRewards)}
            {pendingIotRewards > 0 && RewardItem('IOT', pendingIotRewards)}
          </Box>
          <Box flexGrow={2}>
            <Box flexGrow={1} />
            <ButtonPressable
              marginBottom="l"
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="surfaceSecondary"
              backgroundColorDisabledOpacity={0.5}
              titleColorDisabled="secondaryText"
              title={t('collectablesScreen.hotspots.addAllToAccount')}
              titleColor="black"
              marginHorizontal="l"
              onPress={onClaimRewards}
            />
          </Box>
        </Box>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default ClaimAllRewardsScreen
