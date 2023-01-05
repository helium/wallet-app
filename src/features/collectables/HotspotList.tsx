import React, { useCallback, useMemo } from 'react'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RefreshControl } from 'react-native'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useColors } from '../../theme/themeHooks'
import Box from '../../components/Box'
import { NFTSkeleton } from './NftListItem'
import { CompressedNFT } from '../../types/solana'
import { CollectableNavigationProp } from './collectablesTypes'
import HotspotListItem from './HotspotListItem'
import ButtonPressable from '../../components/ButtonPressable'
import useHotspots from '../../hooks/useHotspots'
import CircleLoader from '../../components/CircleLoader'

const HotspotList = () => {
  const { bottom } = useSafeAreaInsets()
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const isFocused = useIsFocused()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])
  const { primaryText } = useColors()
  const {
    hotspots,
    hotspotsWithMeta,
    loading: loadingHotspots,
    refresh,
    claimAllMobileRewards: { loading: loadingMobile, error: errorMobile },
    claimAllIotRewards: { loading: loadingIot, error: errorIot },
    pendingIotRewards,
    pendingMobileRewards,
    createHotspot,
    fetchMore,
    fetchingMore,
  } = useHotspots()

  const handleNavigateToCollectable = useCallback(
    (collectable: CompressedNFT) => {
      if (collectable.content.metadata) {
        navigation.navigate('HotspotDetailsScreen', { collectable })
      }
    },
    [navigation],
  )

  const handleOnEndReached = useCallback(() => {
    if (!fetchingMore && isFocused) {
      fetchMore()
    }
  }, [fetchingMore, isFocused, fetchMore])

  const handleNavigateToClaimRewards = useCallback(() => {
    navigation.navigate('ClaimAllRewardsScreen')
  }, [navigation])

  const renderHeader = useCallback(() => {
    return (
      <>
        <ButtonPressable
          style={{ flexBasis: 0 }}
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
          marginHorizontal="l"
          disabled={
            loadingMobile ||
            !!errorMobile ||
            loadingIot ||
            !!errorIot ||
            (pendingIotRewards === 0 && pendingMobileRewards === 0)
          }
          onPress={handleNavigateToClaimRewards}
        />
        {__DEV__ && (
          <ButtonPressable
            style={{ flexBasis: 0 }}
            flexGrow={1}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            title="Create Hotspot"
            titleColor="black"
            marginBottom="m"
            marginHorizontal="l"
            onPress={createHotspot}
          />
        )}
      </>
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
    t,
  ])

  const renderCollectable = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: CompressedNFT }) => {
      return (
        <HotspotListItem hotspot={item} onPress={handleNavigateToCollectable} />
      )
    },
    [handleNavigateToCollectable],
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

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomSpace,
    }),
    [bottomSpace],
  )

  const Footer = useCallback(() => {
    return fetchingMore ? (
      <Box marginTop="m">
        <CircleLoader loaderSize={40} />
      </Box>
    ) : null
  }, [fetchingMore])

  return (
    <FlatList
      data={hotspotsWithMeta}
      numColumns={2}
      columnWrapperStyle={{
        flexDirection: 'row',
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
      contentContainerStyle={contentContainerStyle}
      renderItem={renderCollectable}
      ListEmptyComponent={renderEmptyComponent}
      onEndReachedThreshold={0.01}
      onEndReached={handleOnEndReached}
      keyExtractor={keyExtractor}
      ListFooterComponent={Footer}
    />
  )
}

export default HotspotList
