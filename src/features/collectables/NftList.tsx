import React, { useCallback, useMemo } from 'react'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { RefreshControl } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import Box from '../../components/Box'
import useCollectables from '../../hooks/useCollectables'
import NFTListItem, { NFTSkeleton } from './NftListItem'
import { useColors, useSpacing } from '../../theme/themeHooks'
import CircleLoader from '../../components/CircleLoader'

const NftList = () => {
  const spacing = useSpacing()
  const isFocused = useIsFocused()

  const {
    collectables,
    collectablesWithMeta,
    loading: loadingCollectables,
    refresh,
    fetchMore,
    fetchingMore,
  } = useCollectables()
  const { primaryText } = useColors()

  const handleOnEndReached = useCallback(() => {
    if (!fetchingMore && isFocused) {
      fetchMore()
    }
  }, [fetchingMore, isFocused, fetchMore])

  const flatListItems = useMemo(() => {
    return Object.keys(collectablesWithMeta).filter((key) => key !== 'HOTSPOT')
  }, [collectablesWithMeta])

  const renderItem = useCallback(
    ({
      item: token,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item: string
    }) => {
      return <NFTListItem item={token} collectables={collectablesWithMeta} />
    },
    [collectablesWithMeta],
  )

  const renderEmptyComponent = useCallback(() => {
    if (!loadingCollectables) return null

    if (loadingCollectables) {
      return (
        <Box flex={1} flexDirection="row">
          {times(
            Object.keys(collectables).filter((key) => key !== 'HOTSPOT').length,
          ).map((i) => (
            <NFTSkeleton key={i} />
          ))}
        </Box>
      )
    }

    return null
  }, [collectables, loadingCollectables])

  const keyExtractor = useCallback((item: string) => {
    return item
  }, [])

  const contentContainerStyle = useMemo(
    () => ({
      marginTop: spacing.m,
    }),
    [spacing.m],
  )
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
      enabled
      data={flatListItems}
      numColumns={2}
      refreshControl={
        <RefreshControl
          refreshing={loadingCollectables}
          onRefresh={refresh}
          title=""
          tintColor={primaryText}
        />
      }
      columnWrapperStyle={{
        flexDirection: 'row',
      }}
      contentContainerStyle={contentContainerStyle}
      renderItem={renderItem}
      ListEmptyComponent={renderEmptyComponent}
      keyExtractor={keyExtractor}
      onEndReachedThreshold={0.01}
      onEndReached={handleOnEndReached}
      ListFooterComponent={Footer}
    />
  )
}

export default NftList
