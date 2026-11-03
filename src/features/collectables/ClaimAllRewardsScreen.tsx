import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useHotspots from '@hooks/useHotspots'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { useNavigation } from '@react-navigation/native'
import { useModal } from '@storage/ModalsProvider'
import {
  HNT_LAZY_KEY,
  IOT_LAZY_KEY,
  MIN_BALANCE_THRESHOLD,
  MOBILE_LAZY_KEY,
} from '@utils/constants'
import BN from 'bn.js'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import { PublicKey } from '@solana/web3.js'
import BackHeader from './components/BackHeader'
import { CollectableNavigationProp } from './collectablesTypes'
import RewardItem from './RewardItem'

const SafeArea = withUniwind(TabSafeAreaView)

const ClaimAllRewardsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<CollectableNavigationProp>()
  const wallet = useCurrentWallet()
  const { submitClaimAllRewards } = useSubmitTxn()
  const { showModal } = useModal()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const hasEnoughSol = (solBalance || new BN(0)).gt(
    new BN(MIN_BALANCE_THRESHOLD),
  )
  const {
    hotspots,
    hotspotsWithMeta,
    pendingIotRewards,
    pendingMobileRewards,
    pendingHntRewards,
    totalHotspots,
  } = useHotspots()

  const [redeeming, setRedeeming] = useState(false)
  const [claimError, setClaimError] = useState<string | undefined>()

  const title = t('collectablesScreen.hotspots.claimAllRewards')

  const subtitle = t('collectablesScreen.hotspots.hotspotCount', {
    count: totalHotspots,
  })

  const onClaimRewards = async () => {
    try {
      setClaimError(undefined)
      setRedeeming(true)
      const claim = async () => {
        const lazyKeys: PublicKey[] = []
        if (pendingHntRewards && pendingHntRewards.gt(new BN(0))) {
          lazyKeys.push(HNT_LAZY_KEY)
        }
        if (pendingIotRewards && pendingIotRewards.gt(new BN(0))) {
          lazyKeys.push(IOT_LAZY_KEY)
        }
        if (pendingMobileRewards && pendingMobileRewards.gt(new BN(0))) {
          lazyKeys.push(MOBILE_LAZY_KEY)
        }

        const batchId = await submitClaimAllRewards(
          lazyKeys,
          hotspotsWithMeta,
          totalHotspots,
        )

        navigation.replace('ClaimingRewardsScreen', { batchIds: [batchId] })

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
  }
  const hasMore = hotspots.length < (totalHotspots || 0)

  return (
    <Animated.View className="flex-1 bg-background">
      <View className="flex-1">
        <SafeArea edges={['top']}>
          <BackHeader title={title} />
        </SafeArea>
        <View className="grow px-4">
          <View className="grow-[2] items-center">
            <View className="grow">
              <Text className="text-muted-foreground">{subtitle}</Text>
            </View>
            <Text size="2xl" className="mb-8 text-center font-medium">
              {t('collectablesScreen.hotspots.hotspotsClaimMessage')}
            </Text>
          </View>
          <ScrollView horizontal>
            <View className="grow flex-row items-center justify-center">
              {hasMore ||
              (pendingHntRewards && pendingHntRewards.gt(new BN(0))) ? (
                <RewardItem
                  mint={HNT_MINT}
                  amount={pendingHntRewards || new BN(0)}
                  className="me-2"
                  hasMore={hasMore}
                />
              ) : null}
              {hasMore ||
              (pendingMobileRewards && pendingMobileRewards.gt(new BN(0))) ? (
                <RewardItem
                  mint={MOBILE_MINT}
                  amount={pendingMobileRewards || new BN(0)}
                  className="me-2"
                  hasMore={hasMore}
                />
              ) : null}
              {hasMore ||
              (pendingIotRewards && pendingIotRewards.gt(new BN(0))) ? (
                <RewardItem
                  mint={IOT_MINT}
                  amount={pendingIotRewards || new BN(0)}
                  hasMore={hasMore}
                />
              ) : null}
            </View>
          </ScrollView>
          {!!claimError && (
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
          <SafeArea edges={['bottom']}>
            <Button
              variant="cta"
              size="dashboard"
              className="mx-6 mb-6"
              onPress={() => void onClaimRewards().catch(console.error)}
              disabled={redeeming}
            >
              {redeeming ? (
                <Spinner colorClassName="accent-white" />
              ) : (
                t('collectablesScreen.hotspots.claimAllRewards')
              )}
            </Button>
          </SafeArea>
        </View>
      </View>
    </Animated.View>
  )
}

export default ClaimAllRewardsScreen
