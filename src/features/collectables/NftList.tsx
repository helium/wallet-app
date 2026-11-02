import React, { useEffect } from 'react'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { RefreshControl, View } from 'react-native'
import useCollectables from '@hooks/useCollectables'
import { useNavigation } from '@react-navigation/native'
import { useCSSVariable } from 'uniwind'
import NFTListItem, { NFTSkeleton } from './NftListItem'
import { CollectableNavigationProp } from './collectablesTypes'

const CONTENT_CONTAINER_STYLE = { marginTop: 16, paddingHorizontal: 8 }

const COLUMN_WRAPPER_STYLE = { flexDirection: 'row' } as const

const NftList = () => {
  const navigation = useNavigation<CollectableNavigationProp>()

  const {
    collectables,
    collectablesWithMeta,
    loading: loadingCollectables,
    refresh,
  } = useCollectables()
  const foreground = useCSSVariable('--color-foreground') as string | undefined

  useEffect(() => {
    return navigation.addListener('focus', () => {
      refresh()
    })
  }, [navigation, refresh])

  const flatListItems = collectablesWithMeta
    ? Object.keys(collectablesWithMeta)
    : []

  const renderItem = ({ item: token }: { item: string }) => (
    <NFTListItem
      item={collectablesWithMeta[token][0]?.content?.metadata?.symbol}
      collectables={collectablesWithMeta[token]}
    />
  )

  const renderEmptyComponent = () => {
    if (!loadingCollectables) return null

    return (
      <View className="flex-1 flex-row">
        {times(Object.keys(collectables || []).length).map((i) => (
          <NFTSkeleton key={i} />
        ))}
      </View>
    )
  }

  const keyExtractor = (item: string) => item

  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      enabled
      data={flatListItems}
      numColumns={2}
      refreshControl={
        <RefreshControl
          refreshing={loadingCollectables}
          onRefresh={refresh}
          title=""
          tintColor={foreground}
        />
      }
      columnWrapperStyle={COLUMN_WRAPPER_STYLE}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      renderItem={renderItem}
      ListEmptyComponent={renderEmptyComponent}
      keyExtractor={keyExtractor}
    />
  )
}

export default NftList
