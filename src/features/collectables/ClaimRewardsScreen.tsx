import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { DelayedFadeIn } from '@components/FadeInOut'
import RewardItem from '@components/RewardItem'
import Text from '@components/Text'
import { IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useHotspot } from '@hooks/useHotspot'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import BN from 'bn.js'
import React, { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { Mints } from '../../utils/constants'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

type Route = RouteProp<CollectableStackParamList, 'ClaimRewardsScreen'>

const ClaimRewardsScreen = () => {
  const { t } = useTranslation()
  const nav = useNavigation<CollectableNavigationProp>()
  const route = useRoute<Route>()
  const [redeeming, setRedeeming] = useState(false)
  const [claimError, setClaimError] = useState<string | undefined>()
  const { hotspot } = route.params
  const mint = useMemo(() => new PublicKey(hotspot.id), [hotspot.id])
  const { submitClaimRewards } = useSubmitTxn()

  const { createClaimMobileTx, createClaimIotTx } = useHotspot(mint)

  const pendingIotRewards = useMemo(
    () =>
      hotspot &&
      hotspot.pendingRewards &&
      new BN(hotspot.pendingRewards[Mints.IOT]),
    [hotspot],
  )

  const pendingMobileRewards = useMemo(
    () =>
      hotspot &&
      hotspot.pendingRewards &&
      new BN(hotspot.pendingRewards[Mints.MOBILE]),
    [hotspot],
  )

  const title = useMemo(() => {
    return t('collectablesScreen.hotspots.claimRewards')
  }, [t])

  const subtitle = useMemo(() => {
    return hotspot?.content?.metadata?.name || ''
  }, [hotspot.content.metadata.name])

  const onClaimRewards = async () => {
    if (redeeming) return

    try {
      setClaimError(undefined)
      setRedeeming(true)
      const claimIotTx =
        pendingIotRewards && !pendingIotRewards.eq(new BN(0))
          ? await createClaimIotTx()
          : undefined
      const claimMobileTx =
        pendingMobileRewards && !pendingMobileRewards.eq(new BN(0))
          ? await createClaimMobileTx()
          : undefined
      const transactions: VersionedTransaction[] = []

      if (claimIotTx && pendingIotRewards) {
        transactions.push(claimIotTx)
      }

      if (claimMobileTx && pendingMobileRewards) {
        transactions.push(claimMobileTx)
      }

      if (transactions.length > 0) {
        await submitClaimRewards(transactions)
        nav.push('ClaimingRewardsScreen')
      } else {
        setClaimError(t('collectablesScreen.claimError'))
      }

      setRedeeming(false)
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClaimError((e as any)?.response?.data?.error || (e as Error)?.message)
      setRedeeming(false)
    }
  }

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
            justifyContent="center"
            flexDirection="row"
          >
            {!!pendingMobileRewards && pendingMobileRewards.gt(new BN(0)) && (
              <RewardItem
                mint={MOBILE_MINT}
                amount={pendingMobileRewards}
                marginEnd="s"
                hasMore={false}
              />
            )}
            {!!pendingIotRewards && pendingIotRewards.gt(new BN(0)) && (
              <RewardItem
                mint={IOT_MINT}
                amount={pendingIotRewards}
                marginStart="s"
                hasMore={false}
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
              !redeeming ? t('collectablesScreen.hotspots.claimRewards') : ''
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

export default memo(ClaimRewardsScreen)
