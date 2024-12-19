import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { DelayedFadeIn } from '@components/FadeInOut'
import RewardItem from '@components/RewardItem'
import Text from '@components/Text'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useHotspots from '@hooks/useHotspots'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { useNavigation } from '@react-navigation/native'
import { useModal } from '@config/storage/ModalsProvider'
import {
  HNT_LAZY_KEY,
  IOT_LAZY_KEY,
  MIN_BALANCE_THRESHOLD,
  MOBILE_LAZY_KEY,
} from '@utils/constants'
import BN from 'bn.js'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CollectableNavigationProp } from './hotspotTypes'

const ClaimAllRewardsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<CollectableNavigationProp>()
  const wallet = useCurrentWallet()
  const { submitClaimAllRewards } = useSubmitTxn()
  const { showModal } = useModal()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const hasEnoughSol = useMemo(() => {
    return (solBalance || new BN(0)).gt(new BN(MIN_BALANCE_THRESHOLD))
  }, [solBalance])
  const {
    hotspots,
    hotspotsWithMeta,
    pendingIotRewards,
    pendingMobileRewards,
    totalHotspots,
  } = useHotspots()

  const [redeeming, setRedeeming] = useState(false)
  const [claimError, setClaimError] = useState<string | undefined>()

  const title = useMemo(() => {
    return t('collectablesScreen.hotspots.claimAllRewards')
  }, [t])

  const subtitle = useMemo(() => {
    return t('collectablesScreen.hotspots.hotspotCount', {
      count: totalHotspots,
    })
  }, [totalHotspots, t])

  const onClaimRewards = useCallback(async () => {
    try {
      setClaimError(undefined)
      setRedeeming(true)
      const claim = async () => {
        await submitClaimAllRewards(
          [IOT_LAZY_KEY, MOBILE_LAZY_KEY, HNT_LAZY_KEY],
          hotspotsWithMeta,
          totalHotspots,
        )

        navigation.replace('ClaimingRewardsScreen')

        setRedeeming(false)
      }

      if (!hasEnoughSol) {
        showModal({
          type: 'InsufficientSolConversion',
          onCancel: async () => {
            setRedeeming(false)
          },
          onSuccess: claim,
        })
      } else {
        await claim()
      }
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClaimError((e as any)?.response?.data?.error || (e as Error)?.message)
      setRedeeming(false)
    }
  }, [
    hasEnoughSol,
    submitClaimAllRewards,
    hotspotsWithMeta,
    totalHotspots,
    navigation,
    showModal,
  ])
  const hasMore = hotspots.length < (totalHotspots || 0)

  return (
    <ReAnimatedBox
      flex={1}
      entering={DelayedFadeIn}
      backgroundColor="primaryBackground"
    >
      <BackScreen title={title} paddingVertical="0" paddingHorizontal="5">
        <Box flexGrow={1}>
          <Box flexGrow={2} alignItems="center">
            <Box flexGrow={1}>
              <Text variant="textSmRegular" color="secondaryText">
                {subtitle}
              </Text>
            </Box>
            <Text variant="displayXsMedium" textAlign="center" marginBottom="8">
              {t('collectablesScreen.hotspots.hotspotsClaimMessage')}
            </Text>
          </Box>
          <Box
            flexGrow={1}
            alignItems="center"
            justifyContent="center"
            flexDirection="row"
          >
            {hasMore ||
            (pendingMobileRewards && pendingMobileRewards.gt(new BN(0))) ? (
              <RewardItem
                mint={MOBILE_MINT}
                amount={pendingMobileRewards || new BN(0)}
                marginEnd="2"
                hasMore={hasMore}
              />
            ) : null}
            {hasMore ||
            (pendingIotRewards && pendingIotRewards.gt(new BN(0))) ? (
              <RewardItem
                mint={IOT_MINT}
                amount={pendingIotRewards || new BN(0)}
                marginStart="2"
                hasMore={hasMore}
              />
            ) : null}
          </Box>
          {claimError && (
            <Box>
              <Text
                variant="textSmRegular"
                color="error.500"
                marginTop="8"
                numberOfLines={2}
                textAlign="center"
              >
                {claimError}
              </Text>
            </Box>
          )}
          <Box flexGrow={1} />
          <ButtonPressable
            marginBottom="6"
            borderRadius="full"
            backgroundColor="primaryText"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="bg.tertiary"
            backgroundColorDisabledOpacity={0.5}
            titleColorDisabled="secondaryText"
            title={
              !redeeming ? t('collectablesScreen.hotspots.claimAllRewards') : ''
            }
            titleColor="primaryBackground"
            onPress={onClaimRewards}
            disabled={redeeming}
            TrailingComponent={
              redeeming ? (
                <CircleLoader loaderSize={20} color="primaryText" />
              ) : undefined
            }
          />
        </Box>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(ClaimAllRewardsScreen)
