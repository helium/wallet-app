import React, { useCallback, useMemo, memo } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { Ticker } from '@helium/currency'
import { PublicKey } from '@solana/web3.js'
import RewardBG from '@assets/images/rewardBg.svg'
import { ReAnimatedBox } from '../../components/AnimatedBox'
import BackScreen from '../../components/BackScreen'
import Box from '../../components/Box'
import Text from '../../components/Text'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import ButtonPressable from '../../components/ButtonPressable'
import { DelayedFadeIn } from '../../components/FadeInOut'
import { useHotspot } from '../../hooks/useHotspot'
import TokenIcon from '../../components/TokenIcon'
import useHotspots from '../../hooks/useHotspots'

type Route = RouteProp<CollectableStackParamList, 'ClaimRewardsScreen'>

const ClaimRewardsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<CollectableNavigationProp>()
  const route = useRoute<Route>()

  const { hotspot } = route.params

  const mint = useMemo(() => new PublicKey(hotspot.id), [hotspot.id])

  const { claimMobileRewards, claimIotRewards } = useHotspot(mint)

  const { getPendingHotspotRewards } = useHotspots()

  const { pendingMobileRewards, pendingIotRewards } = useMemo(
    () => getPendingHotspotRewards(mint.toBase58()),
    [mint, getPendingHotspotRewards],
  )

  const title = useMemo(() => {
    return t('collectablesScreen.hotspots.claimRewards')
  }, [t])

  const subtitle = useMemo(() => {
    return hotspot?.content?.metadata?.name || ''
  }, [hotspot.content.metadata.name])

  const onClaimRewards = useCallback(async () => {
    claimIotRewards()
    claimMobileRewards()
    navigation.push('ClaimingRewardsScreen')
  }, [claimIotRewards, claimMobileRewards, navigation])

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

        <TokenIcon ticker={ticker} size={70} />

        <Text
          marginTop="m"
          variant="h3Medium"
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.1}
        >
          {amountToText}
        </Text>
        <Text variant="subtitle3" color="secondaryText">
          {ticker}
        </Text>
      </Box>
    )
  }, [])

  const addAllToAccountDisabled = useMemo(() => {
    return pendingIotRewards === 0 && pendingMobileRewards === 0
  }, [pendingIotRewards, pendingMobileRewards])

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
              {t('collectablesScreen.hotspots.hotspotClaimMessage')}
            </Text>
          </Box>
          <Box
            flexGrow={1}
            alignItems="center"
            justifyContent={
              !!pendingMobileRewards &&
              pendingMobileRewards > 0 &&
              !!pendingIotRewards &&
              pendingIotRewards > 0
                ? 'space-between'
                : 'center'
            }
            flexDirection="row"
          >
            {!!pendingMobileRewards &&
              pendingMobileRewards > 0 &&
              RewardItem('MOBILE', pendingMobileRewards)}
            {!!pendingIotRewards &&
              pendingIotRewards > 0 &&
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
              title={t('collectablesScreen.hotspots.addToAccount')}
              titleColor="black"
              marginHorizontal="l"
              onPress={onClaimRewards}
              disabled={addAllToAccountDisabled}
            />
          </Box>
        </Box>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(ClaimRewardsScreen)
