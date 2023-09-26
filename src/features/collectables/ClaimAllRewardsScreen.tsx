import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { DelayedFadeIn } from '@components/FadeInOut'
import RewardItem from '@components/RewardItem'
import Text from '@components/Text'
import {
  IOT_MINT,
  MOBILE_MINT,
  sendAndConfirmWithRetry,
  toNumber,
} from '@helium/spl-utils'
import useAlert from '@hooks/useAlert'
import { useHntSolConvert } from '@hooks/useHntSolConvert'
import useHotspots from '@hooks/useHotspots'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { useNavigation } from '@react-navigation/native'
import { IOT_LAZY_KEY, MOBILE_LAZY_KEY } from '@utils/constants'
import BN from 'bn.js'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSolana } from '../../solana/SolanaProvider'
import { BalanceChange } from '../../solana/walletSignBottomSheetTypes'
import { CollectableNavigationProp } from './collectablesTypes'

const ClaimAllRewardsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<CollectableNavigationProp>()
  const [redeeming, setRedeeming] = useState(false)
  const [claimError, setClaimError] = useState<string | undefined>()
  const { submitClaimAllRewards } = useSubmitTxn()
  const {
    hntEstimateLoading,
    hntSolConvertTransaction,
    hntEstimate,
    hasEnoughSol,
  } = useHntSolConvert()
  const { showOKCancelAlert } = useAlert()
  const { anchorProvider } = useSolana()
  const showHNTConversionAlert = useCallback(async () => {
    if (!anchorProvider || !hntSolConvertTransaction) return false

    const decision = await showOKCancelAlert({
      title: t('browserScreen.insufficientSolToPayForFees'),
      message: t('browserScreen.wouldYouLikeToConvert', {
        amount: toNumber(hntEstimate || 0, 8),
        ticker: 'HNT',
      }),
    })

    if (!decision) return false
    const signed = await anchorProvider.wallet.signTransaction(
      hntSolConvertTransaction,
    )
    await sendAndConfirmWithRetry(
      anchorProvider.connection,
      signed.serialize(),
      {
        skipPreflight: true,
      },
      'confirmed',
    )
    return true
  }, [
    anchorProvider,
    hntSolConvertTransaction,
    showOKCancelAlert,
    t,
    hntEstimate,
  ])

  const {
    hotspots,
    hotspotsWithMeta,
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
      if (!hasEnoughSol) {
        const success = await showHNTConversionAlert()
        if (!success) {
          setRedeeming(false)
          return
        }
      }

      const balanceChanges: BalanceChange[] = []

      if (pendingIotRewards) {
        balanceChanges.push({
          ticker: 'IOT',
          amount: toNumber(pendingIotRewards, 6),
          type: 'receive',
        })
      }

      if (pendingMobileRewards) {
        balanceChanges.push({
          ticker: 'MOBILE',
          amount: toNumber(pendingMobileRewards, 6),
          type: 'receive',
        })
      }

      await submitClaimAllRewards(
        [IOT_LAZY_KEY, MOBILE_LAZY_KEY],
        hotspotsWithMeta,
      )

      navigation.replace('ClaimingRewardsScreen')

      setRedeeming(false)
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClaimError((e as any)?.response?.data?.error || (e as Error)?.message)
      setRedeeming(false)
    }
  }, [
    hasEnoughSol,
    pendingIotRewards,
    pendingMobileRewards,
    submitClaimAllRewards,
    hotspotsWithMeta,
    navigation,
    showHNTConversionAlert,
  ])

  const addAllToAccountDisabled = useMemo(() => {
    return (
      pendingIotRewards &&
      pendingIotRewards.eq(new BN(0)) &&
      pendingMobileRewards &&
      pendingMobileRewards.eq(new BN(0))
    )
  }, [pendingIotRewards, pendingMobileRewards])

  return (
    <ReAnimatedBox
      flex={1}
      entering={DelayedFadeIn}
      backgroundColor="primaryBackground"
    >
      <BackScreen title={title} paddingVertical="none" paddingHorizontal="m">
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
                mint={MOBILE_MINT}
                amount={pendingMobileRewards}
                marginEnd="s"
              />
            )}
            {pendingIotRewards && pendingIotRewards.gt(new BN(0)) && (
              <RewardItem
                mint={IOT_MINT}
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
            disabled={
              addAllToAccountDisabled || redeeming || hntEstimateLoading
            }
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
