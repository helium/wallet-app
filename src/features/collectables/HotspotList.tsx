import React, { useCallback, useMemo, useState } from 'react'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { RefreshControl } from 'react-native'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import BN from 'bn.js'
import listViewIcon from '@assets/images/listViewIcon.svg'
import expandedViewIcon from '@assets/images/expandedViewIcon.svg'
import type { HotspotWithPendingRewards } from '../../utils/solanaUtils'
import { useColors } from '../../theme/themeHooks'
import Box from '../../components/Box'
import { NFTSkeleton } from './NftListItem'
import { CompressedNFT } from '../../types/solana'
import { CollectableNavigationProp } from './collectablesTypes'
import HotspotListItem from './HotspotListItem'
import HotspotCompressedListItem from './HotspotCompressedListItem'
import ButtonPressable from '../../components/ButtonPressable'
import useHotspots from '../../hooks/useHotspots'
import CircleLoader from '../../components/CircleLoader'
import useHaptic from '../../hooks/useHaptic'
import Text from '../../components/Text'
import { formatLargeNumber } from '../../utils/accountUtils'
import TokenIcon from '../../components/TokenIcon'
import TabBar from '../../components/TabBar'

const HotspotList = () => {
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const isFocused = useIsFocused()
  const { primaryText } = useColors()
  const { triggerImpact } = useHaptic()

  const tabBarOptions = useMemo(
    () => [
      {
        value: 'list',
        Icon: listViewIcon,
        iconSize: 32,
      },
      {
        value: 'expanded',
        Icon: expandedViewIcon,
        iconSize: 32,
      },
    ],
    [],
  )

  const [tabSelected, setTabSelected] = useState(tabBarOptions[0].value)

  const {
    hotspots,
    hotspotsWithMeta,
    loading: loadingHotspots,
    refresh,
    claimAllMobileRewards: { loading: loadingMobile, error: errorMobile },
    claimAllIotRewards: { loading: loadingIot, error: errorIot },
    createHotspot,
    fetchMore,
    fetchingMore,
    pendingIotRewards,
    pendingMobileRewards,
  } = useHotspots()

  const handleNavigateToCollectable = useCallback(
    (collectable: HotspotWithPendingRewards) => {
      if (collectable.content.metadata) {
        triggerImpact('light')
        navigation.navigate('HotspotDetailsScreen', { collectable })
      }
    },
    [navigation, triggerImpact],
  )

  const handleOnEndReached = useCallback(() => {
    if (!fetchingMore && isFocused) {
      fetchMore()
    }
  }, [fetchingMore, isFocused, fetchMore])

  const handleNavigateToClaimRewards = useCallback(() => {
    navigation.navigate('ClaimAllRewardsScreen')
  }, [navigation])

  const RewardItem = useCallback(({ ticker, amount, ...rest }) => {
    return (
      <Box
        paddingVertical="m"
        paddingHorizontal="m"
        alignItems="center"
        justifyContent="center"
        backgroundColor="secondaryBackground"
        borderRadius="xl"
        flex={1}
        flexDirection="row"
        {...rest}
      >
        <TokenIcon ticker={ticker} size={30} />

        <Box marginStart="s">
          <Text
            marginTop="xs"
            variant="h4Medium"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatLargeNumber(amount)}
          </Text>
          <Text variant="subtitle4" color="secondaryText">
            {ticker}
          </Text>
        </Box>
      </Box>
    )
  }, [])

  const onTabSelected = useCallback(
    (value) => {
      setTabSelected(value)
    },
    [setTabSelected],
  )

  const renderHeader = useCallback(() => {
    return (
      <Box marginHorizontal="l" marginTop="l">
        <TabBar
          tabBarOptions={tabBarOptions}
          onItemSelected={onTabSelected}
          selectedValue={tabSelected}
          hasIndicator={false}
          hasDivider={false}
          marginBottom="l"
        />
        <Box flexDirection="row">
          <RewardItem
            ticker="MOBILE"
            amount={pendingMobileRewards}
            marginEnd="s"
          />
          <RewardItem ticker="IOT" amount={pendingIotRewards} marginStart="s" />
        </Box>
        <ButtonPressable
          flexGrow={1}
          marginTop="l"
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="surfaceSecondary"
          backgroundColorDisabledOpacity={0.5}
          titleColorDisabled="secondaryText"
          title={t('collectablesScreen.hotspots.claimAllRewards')}
          titleColor="black"
          marginBottom="m"
          disabled={
            loadingMobile ||
            !!errorMobile ||
            loadingIot ||
            !!errorIot ||
            (pendingIotRewards &&
              pendingIotRewards.eq(new BN('0')) &&
              pendingMobileRewards &&
              pendingMobileRewards.eq(new BN('0')))
          }
          onPress={handleNavigateToClaimRewards}
        />
        {__DEV__ && (
          <ButtonPressable
            flexGrow={1}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            title="Create Hotspot"
            titleColor="black"
            marginBottom="m"
            onPress={createHotspot}
          />
        )}
      </Box>
    )
  }, [
    createHotspot,
    errorIot,
    errorMobile,
    handleNavigateToClaimRewards,
    loadingIot,
    loadingMobile,
    pendingIotRewards,
    pendingMobileRewards,
    RewardItem,
    t,
    onTabSelected,
    tabSelected,
    tabBarOptions,
  ])

  const renderCollectable = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: HotspotWithPendingRewards }) => {
      if (tabSelected === 'list') {
        return (
          <HotspotCompressedListItem
            hotspot={item}
            onPress={handleNavigateToCollectable}
            key={item.id}
            marginBottom="xs"
          />
        )
      }
      return (
        <HotspotListItem
          hotspot={item}
          onPress={handleNavigateToCollectable}
          key={item.id}
        />
      )
    },
    [handleNavigateToCollectable, tabSelected],
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
      <Box marginTop="m" marginBottom="s">
        {fetchingMore ? <CircleLoader loaderSize={40} /> : <Box height={40} />}
      </Box>
    ),
    [fetchingMore],
  )

  return (
    <FlatList
      data={hotspotsWithMeta}
      numColumns={2}
      columnWrapperStyle={{
        flexDirection: tabSelected === 'list' ? 'column' : 'row',
      }}
      ListHeaderComponent={renderHeader}
      refreshControl={
        <RefreshControl
          enabled
          refreshing={loadingHotspots}
          onRefresh={refresh}
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
  )
}

export default HotspotList
