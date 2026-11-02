import { useMint } from '@helium/helium-react-hooks'
import { HNT_MINT, IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import useHotspots from '@hooks/useHotspots'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { times } from 'lodash'
import { Globe, Plus, Repeat } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useCSSVariable, withUniwind } from 'uniwind'
import { CompressedNFT, HotspotWithPendingRewards } from '../../types/solana'
import { formatLargeNumber } from '../../utils/accountUtils'
import HotspotCompressedListItem from './HotspotCompressedListItem'
import { NFTSkeleton } from './NftListItem'
import { CollectableNavigationProp } from './collectablesTypes'

const GlobeIcon = withUniwind(Globe)
const PlusIcon = withUniwind(Plus)
const AutomationIcon = withUniwind(Repeat)

type AutomationSchedule = 'daily' | 'weekly' | 'monthly' | undefined

function RewardItem({
  mint,
  amount,
  hasMore,
}: {
  mint: PublicKey
  amount: BN | undefined
  hasMore: boolean
}) {
  const decimals = useMint(mint)?.info?.decimals
  const { json, symbol } = useMetaplexMetadata(mint)
  let realAmount = ''
  if (amount) {
    const num = toNumber(amount, decimals || 6)
    realAmount = formatLargeNumber(new BigNumber(num))
  }

  return (
    <View className="flex-row items-center justify-center">
      <TokenIcon img={json?.image} size={24} />
      <Text
        className="ml-1 font-medium"
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.1}
      >
        {realAmount}
        {hasMore ? '+' : ''}
      </Text>
      <Text className="ml-1 font-medium text-muted-foreground">{symbol}</Text>
    </View>
  )
}

const COLUMN_WRAPPER_STYLE = { flexDirection: 'column' } as const

const CONTENT_CONTAINER_STYLE = { paddingHorizontal: 16 }

const BOTTOM_EDGE = ['bottom'] as const

const TabSafeArea = withUniwind(TabSafeAreaView)

const HotspotList = () => {
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const isFocused = useIsFocused()
  const foreground = useCSSVariable('--color-foreground') as string | undefined
  const [automationSchedule] = useState<AutomationSchedule>()

  const {
    hotspots,
    hotspotsWithMeta,
    loading: loadingHotspots,
    refresh,
    fetchMore,
    fetchingMore,
    pendingIotRewards,
    pendingMobileRewards,
    pendingHntRewards,
    onEndReached,
    totalHotspots,
  } = useHotspots()

  const handleOnEndReached = () => {
    if (!fetchingMore && isFocused && !onEndReached) {
      fetchMore()
    }
  }

  const handleNavigateToHotspot = (hotspot: HotspotWithPendingRewards) => {
    if (hotspot.content.metadata) {
      const { iot, mobile } = hotspot.content.metadata.hotspot_infos || {}
      navigation.navigate('HotspotMapScreen', {
        hotspot,
        network: iot?.location
          ? 'IOT'
          : mobile?.location
            ? 'MOBILE'
            : undefined,
      })
    }
  }

  const handleNavigateToClaimRewards = () => {
    navigation.navigate('ClaimAllRewardsScreen')
  }

  const handleNavigateToMap = () => {
    navigation.navigate('HotspotMapScreen')
  }

  const handleNavigateToHotspotOnboard = () => {
    navigation.navigate('OnboardingNavigator')
  }

  const handleNavigateToAutomation = () => {
    navigation.navigate('AutomationSetupScreen')
  }

  useEffect(() => {
    // TODO: Load automation schedule from storage
    // This is where we'll load the saved automation schedule when implementing the actual functionality
    const loadAutomationSchedule = async () => {
      // TODO: Implement loading from storage
      // For now, we'll just leave it undefined
    }
    void loadAutomationSchedule()
  }, [])

  useEffect(() => {
    return navigation.addListener('focus', () => {
      refresh()
    })
  }, [navigation, refresh])

  const header = (
    <View className="mb-2 mt-4 flex-col items-stretch">
      <View className="mb-6 flex-row items-stretch justify-between gap-2">
        <Button
          variant="secondary"
          className="flex-1 rounded-full"
          onPress={handleNavigateToMap}
        >
          <GlobeIcon size={18} colorClassName="accent-secondary-foreground" />
          <Text className="font-medium text-secondary-foreground">
            {t('collectablesScreen.hotspots.openMap')}
          </Text>
        </Button>
        <Button
          className="flex-1 rounded-full"
          onPress={handleNavigateToHotspotOnboard}
        >
          <PlusIcon size={18} colorClassName="accent-primary-foreground" />
          <Text className="font-medium text-primary-foreground">
            {t('collectablesScreen.hotspots.connect')}
          </Text>
        </Button>
      </View>
      <View className="flex-row items-center">
        <View className="h-px grow bg-border" />
        <View className="flex-row items-center px-2">
          <Text className="text-muted-foreground">You own</Text>
          <Text className="ml-1">{totalHotspots} hotspots</Text>
        </View>
        <View className="h-px grow bg-border" />
      </View>
    </View>
  )

  const renderCollectable = ({ item }: { item: HotspotWithPendingRewards }) => (
    <HotspotCompressedListItem
      hotspot={item}
      onPress={handleNavigateToHotspot}
      key={item.id}
      className="mb-2"
    />
  )

  const renderEmptyComponent = () => {
    if (!loadingHotspots) return null

    if (loadingHotspots && hotspots) {
      return (
        <View className="flex-1 flex-row">
          {times(hotspots.length).map((i) => (
            <NFTSkeleton key={i} />
          ))}
        </View>
      )
    }

    return null
  }

  const keyExtractor = (item: CompressedNFT) => item.id

  const footer = (
    <View className="mb-2 mt-4">
      {fetchingMore ? (
        <Spinner size="large" className="h-10" />
      ) : (
        <View className="h-10" />
      )}
    </View>
  )

  const claimDisabled =
    (pendingIotRewards &&
      pendingIotRewards.eq(new BN('0')) &&
      pendingMobileRewards &&
      pendingMobileRewards.eq(new BN('0')) &&
      pendingHntRewards &&
      pendingHntRewards.eq(new BN('0')) &&
      hotspotsWithMeta.length === (totalHotspots || 0)) ||
    hotspotsWithMeta?.length === 0

  return (
    <>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={hotspotsWithMeta}
        numColumns={2}
        columnWrapperStyle={COLUMN_WRAPPER_STYLE}
        contentContainerStyle={CONTENT_CONTAINER_STYLE}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            enabled
            refreshing={loadingHotspots}
            onRefresh={refresh}
            title=""
            tintColor={foreground}
          />
        }
        renderItem={renderCollectable}
        ListEmptyComponent={renderEmptyComponent}
        onEndReachedThreshold={0.001}
        onEndReached={handleOnEndReached}
        keyExtractor={keyExtractor}
        ListFooterComponent={footer}
      />
      <TabSafeArea
        edges={BOTTOM_EDGE}
        className="rounded-t-[12px] bg-secondary"
      >
        <View className="p-4">
          <View className="flex-row justify-evenly">
            <RewardItem
              mint={HNT_MINT}
              amount={pendingHntRewards}
              hasMore={hotspots.length < (totalHotspots || 0)}
            />
            <RewardItem
              mint={MOBILE_MINT}
              amount={pendingMobileRewards}
              hasMore={hotspots.length < (totalHotspots || 0)}
            />
            <RewardItem
              mint={IOT_MINT}
              amount={pendingIotRewards}
              hasMore={hotspots.length < (totalHotspots || 0)}
            />
          </View>
          <View className="mb-6 mt-4 grow flex-row items-center gap-2">
            <Button
              variant="cta"
              size="dashboard"
              className="flex-1 rounded-full"
              onPress={handleNavigateToClaimRewards}
              disabled={claimDisabled}
            >
              {t('collectablesScreen.hotspots.claimAllRewards')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-full"
              onPress={handleNavigateToAutomation}
            >
              <AutomationIcon
                size={20}
                colorClassName={
                  automationSchedule
                    ? 'accent-warning-500'
                    : 'accent-foreground'
                }
              />
            </Button>
          </View>
        </View>
      </TabSafeArea>
    </>
  )
}

export default HotspotList
