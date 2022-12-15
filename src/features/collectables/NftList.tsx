import React, { useCallback, useMemo } from 'react'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RefreshControl } from 'react-native'
import Box from '../../components/Box'
import useCollectables from '../../hooks/useCollectables'
import NFTListItem, { NFTSkeleton } from './NftListItem'
import { useColors } from '../../theme/themeHooks'

const NftList = () => {
  const { bottom } = useSafeAreaInsets()
  const {
    collectables,
    collectablesWithMeta,
    loading: loadingCollectables,
    refresh,
  } = useCollectables()
  const { primaryText } = useColors()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])

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

  const renderFooter = useCallback(() => {
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
      paddingBottom: bottomSpace,
    }),
    [bottomSpace],
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
      ListEmptyComponent={renderFooter}
      keyExtractor={keyExtractor}
    />
  )
}

export default NftList
