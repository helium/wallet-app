import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import BN from 'bn.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { Mints } from '../../utils/constants'
import BackHeader from './components/BackHeader'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import RewardItem from './RewardItem'

const SafeArea = withUniwind(SafeAreaView)

type Route = RouteProp<CollectableStackParamList, 'ClaimRewardsScreen'>

const ClaimRewardsScreen = () => {
  const { t } = useTranslation()
  const nav = useNavigation<CollectableNavigationProp>()
  const route = useRoute<Route>()
  const [redeeming, setRedeeming] = useState(false)
  const [claimError, setClaimError] = useState<string | undefined>()
  const { hotspot } = route.params
  const { submitClaimRewards } = useSubmitTxn()

  const pendingIotRewards =
    hotspot &&
    hotspot.pendingRewards &&
    new BN(hotspot.pendingRewards[Mints.IOT])

  const pendingMobileRewards =
    hotspot &&
    hotspot.pendingRewards &&
    new BN(hotspot.pendingRewards[Mints.MOBILE])

  const pendingHntRewards =
    hotspot &&
    hotspot.pendingRewards &&
    new BN(hotspot.pendingRewards[Mints.HNT])

  const title = t('collectablesScreen.hotspots.claimRewards')

  const subtitle = hotspot?.content?.metadata?.name || ''

  const onClaimRewards = async () => {
    if (redeeming) return

    try {
      setClaimError(undefined)
      setRedeeming(true)
      const batchIds = await submitClaimRewards(hotspot)
      nav.push('ClaimingRewardsScreen', { batchIds })
      setRedeeming(false)
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClaimError((e as any)?.response?.data?.error || (e as Error)?.message)
      setRedeeming(false)
    }
  }

  const addAllToAccountDisabled =
    pendingIotRewards &&
    pendingIotRewards.eq(new BN(0)) &&
    pendingMobileRewards &&
    pendingMobileRewards.eq(new BN(0)) &&
    pendingHntRewards &&
    pendingHntRewards.eq(new BN(0))

  return (
    <Animated.View className="flex-1">
      <SafeArea className="flex-1" edges={['top']}>
        <BackHeader title={title} />
        <View className="grow px-4">
          <View className="grow-[2] items-center">
            <View className="grow">
              <Text className="text-muted-foreground">{subtitle}</Text>
            </View>
            <Text size="2xl" className="mb-8 text-center font-medium">
              {t('collectablesScreen.hotspots.hotspotClaimMessage')}
            </Text>
          </View>
          <View className="grow flex-row items-center justify-center">
            {!!pendingHntRewards && pendingHntRewards.gt(new BN(0)) && (
              <RewardItem
                mint={HNT_MINT}
                amount={pendingHntRewards}
                className="ms-2"
                hasMore={false}
              />
            )}
            {!!pendingMobileRewards && pendingMobileRewards.gt(new BN(0)) && (
              <RewardItem
                mint={MOBILE_MINT}
                amount={pendingMobileRewards}
                className="me-2"
                hasMore={false}
              />
            )}
            {!!pendingIotRewards && pendingIotRewards.gt(new BN(0)) && (
              <RewardItem
                mint={IOT_MINT}
                amount={pendingIotRewards}
                className="ms-2"
                hasMore={false}
              />
            )}
          </View>
          {claimError && (
            <View>
              <Text
                className="mt-8 text-center text-destructive"
                numberOfLines={2}
              >
                {claimError}
              </Text>
            </View>
          )}
          <View className="grow" />
          <Button
            variant="cta"
            size="lg"
            className="mx-6 mb-6"
            onPress={() => void onClaimRewards().catch(console.error)}
            disabled={addAllToAccountDisabled || redeeming}
          >
            {redeeming ? (
              <Spinner colorClassName="accent-white" />
            ) : (
              t('collectablesScreen.hotspots.claimRewards')
            )}
          </Button>
        </View>
      </SafeArea>
    </Animated.View>
  )
}

export default ClaimRewardsScreen
