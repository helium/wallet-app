import React, { memo, useCallback, useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import BN from 'bn.js'
import { Transaction } from '@solana/web3.js'
import { ReAnimatedBox } from '@components/AnimatedBox'
import useHotspots from '@hooks/useHotspots'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import CircleLoader from '@components/CircleLoader'
import RewardItem from '@components/RewardItem'
import useSubmitTxn from '../../graphql/useSubmitTxn'
import { CollectableNavigationProp } from './collectablesTypes'

const ClaimAllRewardsScreen = () => {
  const { submitClaimAllRewards } = useSubmitTxn()
  const { t } = useTranslation()
  const navigation = useNavigation<CollectableNavigationProp>()
  const [redeeming, setRedeeming] = useState(false)
  const [claimError, setClaimError] = useState<string | undefined>()

  const {
    hotspots,
    createClaimAllIotTxs: { execute: createClaimAllIotTxs },
    createClaimAllMobileTxs: { execute: createClaimAllMobileTxs },
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
    try {
      setClaimError(undefined)
      setRedeeming(true)

      const iotTxs =
        pendingIotRewards && !pendingIotRewards.eq(new BN(0))
          ? await createClaimAllIotTxs()
          : undefined
      const mobileTxns =
        pendingMobileRewards && !pendingMobileRewards.eq(new BN(0))
          ? await createClaimAllMobileTxs()
          : undefined
      const txs: Transaction[] = []

      if (iotTxs?.length) {
        txs.push(...iotTxs)
      }

      if (mobileTxns?.length) {
        txs.push(...mobileTxns)
      }

      if (txs.length > 0) {
        submitClaimAllRewards(txs)
        navigation.push('ClaimingRewardsScreen')
      } else {
        setClaimError(t('collectablesScreen.claimError'))
      }

      setRedeeming(false)
    } catch (e) {
      setClaimError((e as Error).message)
      setRedeeming(false)
    }
  }, [
    createClaimAllIotTxs,
    createClaimAllMobileTxs,
    navigation,
    submitClaimAllRewards,
    t,
    pendingIotRewards,
    pendingMobileRewards,
  ])

  const addAllToAccountDisabled = useMemo(() => {
    return (
      pendingIotRewards &&
      pendingIotRewards.eq(new BN(0)) &&
      pendingMobileRewards &&
      pendingMobileRewards.eq(new BN(0))
    )
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
              {t('collectablesScreen.hotspots.hotspotsClaimMessage')}
            </Text>
          </Box>
          <Box
            flexGrow={1}
            alignItems="center"
            justifyContent="center"
            flexDirection="row"
          >
            {pendingMobileRewards && pendingMobileRewards.gt(new BN(0)) && (
              <RewardItem
                ticker="MOBILE"
                amount={pendingMobileRewards}
                marginEnd="s"
              />
            )}
            {pendingIotRewards && pendingIotRewards.gt(new BN(0)) && (
              <RewardItem
                ticker="IOT"
                amount={pendingIotRewards}
                marginStart="s"
              />
            )}
          </Box>
          {claimError && (
            <Box>
              <Text
                variant="body2"
                color="red500"
                marginTop="xl"
                numberOfLines={2}
                textAlign="center"
              >
                {claimError}
              </Text>
            </Box>
          )}
          <Box flexGrow={1} />
          <ButtonPressable
            marginBottom="l"
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="surfaceSecondary"
            backgroundColorDisabledOpacity={0.5}
            titleColorDisabled="secondaryText"
            title={
              !redeeming ? t('collectablesScreen.hotspots.addAllToAccount') : ''
            }
            titleColor="black"
            marginHorizontal="l"
            onPress={onClaimRewards}
            disabled={addAllToAccountDisabled || redeeming}
            TrailingComponent={
              redeeming ? (
                <CircleLoader loaderSize={20} color="white" />
              ) : undefined
            }
          />
        </Box>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(ClaimAllRewardsScreen)
