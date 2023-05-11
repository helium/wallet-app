import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { DelayedFadeIn } from '@components/FadeInOut'
import RewardItem from '@components/RewardItem'
import Text from '@components/Text'
import useHotspots from '@hooks/useHotspots'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { useNavigation } from '@react-navigation/native'
import { IOT_LAZY_KEY, MOBILE_LAZY_KEY } from '@utils/constants'
import BN from 'bn.js'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CollectableNavigationProp } from './collectablesTypes'

const ClaimAllRewardsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<CollectableNavigationProp>()
  const [redeeming, setRedeeming] = useState(false)
  const [claimError, setClaimError] = useState<string | undefined>()
  const { submitClaimAllRewards } = useSubmitTxn()

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

      navigation.replace('ClaimingRewardsScreen')
      submitClaimAllRewards([IOT_LAZY_KEY, MOBILE_LAZY_KEY], hotspotsWithMeta)

      setRedeeming(false)
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClaimError((e as any)?.response?.data?.error || (e as Error)?.message)
      setRedeeming(false)
    }
  }, [navigation, submitClaimAllRewards, hotspotsWithMeta])

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
