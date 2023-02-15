import React, { memo, useCallback, useMemo } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { Ticker } from '@helium/currency'
import RewardBG from '@assets/images/rewardBg.svg'
import BN from 'bn.js'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import useHotspots from '../../hooks/useHotspots'
import BackScreen from '../../components/BackScreen'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { CollectableNavigationProp } from './collectablesTypes'
import ButtonPressable from '../../components/ButtonPressable'
import { DelayedFadeIn } from '../../components/FadeInOut'
import TokenIcon from '../../components/TokenIcon'

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

  const RewardItem = useCallback((ticker: Ticker, amount: BN) => {
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

        <TokenIcon ticker={ticker} size={70} />

        <Text
          marginTop="m"
          variant="h3Medium"
          adjustsFontSizeToFit
          numberOfLines={1}
        >
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
              pendingMobileRewards &&
              pendingMobileRewards.gt(new BN(0)) &&
              pendingIotRewards &&
              pendingIotRewards.gt(new BN(0))
                ? 'space-between'
                : 'center'
            }
            flexDirection="row"
          >
            {pendingMobileRewards &&
              pendingMobileRewards.gt(new BN(0)) &&
              RewardItem('MOBILE', pendingMobileRewards)}
            {pendingIotRewards &&
              pendingIotRewards.gt(new BN(0)) &&
              RewardItem('IOT', pendingIotRewards)}
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

export default memo(ClaimAllRewardsScreen)
