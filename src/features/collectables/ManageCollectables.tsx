import BackScreen from '@components/BackScreen'
import ScrollBox from '@components/ScrollBox'
import { NavBarHeight } from '@components/ServiceNavBar'
import useCollectables from '@hooks/useCollectables'
import { RootState } from '@store/rootReducer'
import { useColors, useSpacing } from '@theme/themeHooks'
import { heliumNFTs } from '@utils/solanaUtils'
import React, { useCallback } from 'react'
import { useAsync } from 'react-async-hook'
import { FlatList, RefreshControl } from 'react-native'
import { useSelector } from 'react-redux'
import CollectionItem, { Collection } from './CollectionItem'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ManageCollectables = () => {
  const { bottom } = useSafeAreaInsets()
  const colors = useColors()
  const spacing = useSpacing()
  const { fetchAllCollectablesByGroup } = useCollectables()
  const approvedCollections = useSelector(
    (state: RootState) => state.collectables.approvedCollections,
  )

  const fetchSortedCollectables = useCallback(async () => {
    const collectables = await fetchAllCollectablesByGroup()

    const collectionItems: Collection[] = Object.keys(collectables).map(
      (key) => {
        const collectable = collectables[key][0]

        return {
          id: key,
          name: collectable.content.metadata?.name || '',
          image: collectable.content?.files[0]?.uri,
          description: collectable.content.metadata?.description || '',
          count: collectables[key].length,
        }
      },
    )

    const approved = approvedCollections || heliumNFTs()

    // sort by approved collections to non-approved collections
    collectionItems.sort((a, b) => {
      if (approved.includes(a.id) && !approved.includes(b.id)) {
        return -1
      } else if (!approved.includes(a.id) && approved.includes(b.id)) {
        return 1
      } else {
        return 0
      }
    })

    return collectionItems
  }, [fetchAllCollectablesByGroup, approvedCollections])

  const {
    result: collectables,
    execute,
    loading,
  } = useAsync(async () => {
    return await fetchSortedCollectables()
  }, [])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ index, item: collection }: { index: number; item: Collection }) => {
      if (!collectables) return null

      const isFirst = index === 0
      const isLast = index === collectables?.length - 1
      const borderTopStartRadius = isFirst ? 'xl' : 'none'
      const borderTopEndRadius = isFirst ? 'xl' : 'none'
      const borderBottomStartRadius = isLast ? 'xl' : 'none'
      const borderBottomEndRadius = isLast ? 'xl' : 'none'

      const approved = approvedCollections || heliumNFTs()

      return (
        <CollectionItem
          collection={collection}
          initalEnabled={approved.includes(collection.id)}
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
          borderWidth={!isLast ? 2 : 0}
        />
      )
    },
    [spacing, approvedCollections, collectables],
  )

  const keyExtractor = useCallback((item: Collection) => {
    return item.id
  }, [])

  return (
    <ScrollBox>
      <BackScreen
        title="Manage collectable list"
        edges={[]}
        headerTopMargin="6xl"
      >
        <FlatList
          refreshControl={
            <RefreshControl
              enabled
              refreshing={loading}
              onRefresh={execute}
              title=""
              tintColor={colors.primaryText}
            />
          }
          data={collectables}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingBottom: NavBarHeight + bottom,
          }}
        />
      </BackScreen>
    </ScrollBox>
  )
}

export default ManageCollectables
