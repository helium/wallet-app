import React, { useMemo, memo, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { PublicKey, Transaction } from '@solana/web3.js'
import BN from 'bn.js'
import CircleLoader from '@components/CircleLoader'
import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import Text from '@components/Text'
import ButtonPressable from '@components/ButtonPressable'
import { DelayedFadeIn } from '@components/FadeInOut'
import { useHotspot } from '@hooks/useHotspot'
import RewardItem from '@components/RewardItem'
import { toNumber } from '@helium/spl-utils'
import { Mints } from '../../utils/constants'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { BalanceChange } from '../../solana/walletSignBottomSheetTypes'

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
      const transactions: Transaction[] = []
      const balanceChanges: BalanceChange[] = []

      if (claimIotTx && pendingIotRewards) {
        transactions.push(claimIotTx)
        balanceChanges.push({
          ticker: 'IOT',
          amount: toNumber(pendingIotRewards, 6),
          type: 'receive',
        })
      }

      if (claimMobileTx && pendingMobileRewards) {
        transactions.push(claimMobileTx)
        balanceChanges.push({
          ticker: 'MOBILE',
          amount: toNumber(pendingMobileRewards, 6),
          type: 'receive',
        })
      }

      if (transactions.length > 0) {
        await submitClaimRewards(transactions, balanceChanges)
        nav.push('ClaimingRewardsScreen')
      } else {
        setClaimError(t('collectablesScreen.claimError'))
      }

      setRedeeming(false)
    } catch (e) {
      setRedeeming(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClaimError((e as any)?.response?.data?.error || (e as Error)?.message)
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
                ticker="MOBILE"
                amount={pendingMobileRewards}
                marginEnd="s"
              />
            )}
            {!!pendingIotRewards && pendingIotRewards.gt(new BN(0)) && (
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
              !redeeming ? t('collectablesScreen.hotspots.addToAccount') : ''
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
