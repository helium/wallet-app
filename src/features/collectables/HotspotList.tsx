import Plus from '@assets/images/plus.svg'
import Globe from '@assets/images/globe.svg'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import TokenIcon from '@components/TokenIcon'
import { useMint } from '@helium/helium-react-hooks'
import { IOT_MINT, MOBILE_MINT, toNumber } from '@helium/spl-utils'
import useHaptic from '@hooks/useHaptic'
import useHotspots from '@hooks/useHotspots'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useColors, useSpacing } from '@theme/themeHooks'
import BigNumber from 'bignumber.js'
import BN from 'bn.js'
import { times } from 'lodash'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ScrollBox from '@components/ScrollBox'
import { CompressedNFT, HotspotWithPendingRewards } from '../../types/solana'
import { formatLargeNumber } from '../../utils/accountUtils'
import HotspotCompressedListItem from './HotspotCompressedListItem'
import { NFTSkeleton } from './NftListItem'
import { CollectableNavigationProp } from './collectablesTypes'

export const DEFAULT_PAGE_AMOUNT = 20

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
    <Box alignItems="center" justifyContent="center" flexDirection="row">
      <TokenIcon img={json?.image} size={24} />
      <Text
        marginLeft="xs"
        color="primaryBackground"
        variant="textSmMedium"
        numberOfLines={1}
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.1}
      >
        {realAmount}
        {hasMore ? '+' : ''}
      </Text>
      <Text marginLeft="xs" variant="textSmMedium" color="gray.50">
        {symbol}
      </Text>
    </Box>
  )
}

const HotspotList = () => {
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const isFocused = useIsFocused()
  const { primaryText } = useColors()
  const { triggerImpact } = useHaptic()
  const spacing = useSpacing()
  const { bottom } = useSafeAreaInsets()

  const {
    hotspots,
    hotspotsWithMeta,
    loading: loadingHotspots,
    refresh,
    fetchMore,
    fetchingMore,
    pendingIotRewards,
    pendingMobileRewards,
    onEndReached,
    totalHotspots,
  } = useHotspots()

  const pageAmount = 20
  const handleOnEndReached = useCallback(() => {
    if (!fetchingMore && isFocused && !onEndReached) {
      fetchMore(pageAmount)
    }
  }, [fetchingMore, isFocused, fetchMore, pageAmount, onEndReached])

  const handleNavigateToHotspot = useCallback(
    (hotspot: HotspotWithPendingRewards) => {
      if (hotspot.content.metadata) {
        triggerImpact('light')
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
    },
    [navigation, triggerImpact],
  )

  const handleNavigateToClaimRewards = useCallback(() => {
    navigation.navigate('ClaimAllRewardsScreen')
  }, [navigation])

  const handleNavigateToMap = useCallback(() => {
    navigation.navigate('HotspotMapScreen')
  }, [navigation])

  const handleNavigateToHotspotOnboard = useCallback(() => {
    navigation.navigate('OnboardingNavigator')
  }, [navigation])

  const renderHeader = useCallback(() => {
    return (
      <Box
        marginTop="4"
        marginBottom="2"
        flexDirection="column"
        alignItems="stretch"
      >
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="stretch"
          marginBottom="6"
          paddingHorizontal="4"
        >
          <ButtonPressable
            height={36}
            borderRadius="full"
            backgroundColor="fg.quinary-400"
            backgroundColorOpacityPressed={0.7}
            flex={1}
            LeadingComponent={
              <Globe width={18} height={18} color="primaryText" />
            }
            title={t('collectablesScreen.hotspots.openMap')}
            titleColor="base.white"
            fontSize={14}
            onPress={handleNavigateToMap}
          />
          <Box marginHorizontal="xs" />
          <ButtonPressable
            height={36}
            borderRadius="full"
            backgroundColor="base.white"
            backgroundColorOpacityPressed={0.7}
            flex={1}
            LeadingComponent={<Plus width={18} height={18} color="black" />}
            title={t('collectablesScreen.hotspots.connect')}
            titleColor="base.black"
            fontSize={14}
            onPress={handleNavigateToHotspotOnboard}
          />
        </Box>
        <Box flexDirection="row" alignItems="center">
          <Box backgroundColor="gray.500" height={1} flexGrow={1} />
          <Box flexDirection="row" alignItems="center" paddingHorizontal="2">
            <Text variant="textSmRegular" color="secondaryText">
              You own
            </Text>
            <Text variant="textSmRegular" color="primaryText" ml="xs">
              {totalHotspots} hotspots
            </Text>
          </Box>

          <Box backgroundColor="gray.500" height={1} flexGrow={1} />
        </Box>
      </Box>
    )
  }, [t, handleNavigateToMap, handleNavigateToHotspotOnboard, totalHotspots])

  const renderCollectable = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: HotspotWithPendingRewards }) => {
      return (
        <HotspotCompressedListItem
          hotspot={item}
          onPress={handleNavigateToHotspot}
          key={item.id}
          marginBottom="2"
          marginHorizontal="4"
        />
      )
    },
    [handleNavigateToHotspot],
  )

  const renderEmptyComponent = useCallback(() => {
    if (!loadingHotspots) return null

    if (loadingHotspots && hotspots) {
      return (
        <Box flex={1} flexDirection="row">
          {times(hotspots.length).map((i) => (
            <NFTSkeleton key={i} />
          ))}
        </Box>
      )
    }

    return null
  }, [hotspots, loadingHotspots])

  const keyExtractor = useCallback((item: CompressedNFT) => {
    return item.id
  }, [])

  const Footer = useCallback(
    () => (
      <Box marginTop="4" marginBottom="2">
        {fetchingMore ? <CircleLoader loaderSize={40} /> : <Box height={40} />}
      </Box>
    ),
    [fetchingMore],
  )

  const handleRefresh = useCallback(() => {
    refresh(pageAmount)
  }, [pageAmount, refresh])

  useEffect(() => {
    return navigation.addListener('focus', () => {
      refresh()
    })
  }, [navigation, refresh])

  return (
    <>
      <ScrollBox>
        <FlatList
          data={hotspotsWithMeta}
          numColumns={2}
          style={{
            marginTop: spacing.xl,
          }}
          columnWrapperStyle={{
            flexDirection: 'column',
          }}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              enabled
              refreshing={loadingHotspots}
              onRefresh={handleRefresh}
              title=""
              tintColor={primaryText}
            />
          }
          renderItem={renderCollectable}
          ListEmptyComponent={renderEmptyComponent}
          onEndReachedThreshold={0.001}
          onEndReached={handleOnEndReached}
          keyExtractor={keyExtractor}
          ListFooterComponent={Footer}
        />
      </ScrollBox>
      <Box
        backgroundColor="fg.quinary-400"
        borderTopLeftRadius="4xl"
        borderTopRightRadius="4xl"
        p="4"
        style={{
          paddingBottom: spacing[4] + bottom,
        }}
      >
        <Box flexDirection="row" justifyContent="space-evenly">
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
        </Box>
        <ButtonPressable
          flexGrow={1}
          marginTop="4"
          borderRadius="full"
          backgroundColor="primaryText"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="secondaryBackground"
          titleColorDisabled="secondaryText"
          title={t('collectablesScreen.hotspots.claimAllRewards')}
          titleColor="primaryBackground"
          disabled={
            (pendingIotRewards &&
              pendingIotRewards.eq(new BN('0')) &&
              pendingMobileRewards &&
              pendingMobileRewards.eq(new BN('0')) &&
              hotspotsWithMeta.length === (totalHotspots || 0)) ||
            hotspotsWithMeta?.length === 0
          }
          onPress={handleNavigateToClaimRewards}
        />
      </Box>
    </>
  )
}

export default HotspotList
