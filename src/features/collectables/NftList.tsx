import React, { useCallback, useMemo, useEffect } from 'react'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { RefreshControl } from 'react-native'
import Box from '@components/Box'
import useCollectables from '@hooks/useCollectables'
import { useColors, useSpacing } from '@theme/themeHooks'
import { useNavigation } from '@react-navigation/native'
import NFTListItem, { NFTSkeleton } from './NftListItem'
import { CollectableNavigationProp } from './collectablesTypes'

const NftList = () => {
  const spacing = useSpacing()
  const navigation = useNavigation<CollectableNavigationProp>()

  const {
    collectables,
    collectablesWithMeta,
    loading: loadingCollectables,
    refresh,
  } = useCollectables()
  const { primaryText } = useColors()

  useEffect(() => {
    return navigation.addListener('focus', () => {
      refresh()
    })
  }, [navigation, refresh])

  const flatListItems = useMemo(() => {
    return collectablesWithMeta ? Object.keys(collectablesWithMeta) : []
  }, [collectablesWithMeta])

  const renderItem = useCallback(
    ({
      item: token,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item: string
    }) => {
      return (
        <NFTListItem
          item={collectablesWithMeta[token][0]?.content?.metadata?.symbol}
          collectables={collectablesWithMeta[token]}
        />
      )
    },
    [collectablesWithMeta],
  )

  const renderEmptyComponent = useCallback(() => {
    if (!loadingCollectables) return null

    if (loadingCollectables) {
      return (
        <Box flex={1} flexDirection="row">
          {times(Object.keys(collectables || []).length).map((i) => (
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
    />
  )
}

export default NftList
