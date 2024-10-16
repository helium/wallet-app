import BackScreen from '@components/BackScreen'
import ScrollBox from '@components/ScrollBox'
import { NavBarHeight } from '@components/ServiceNavBar'
import useCollectables from '@hooks/useCollectables'
import { RootState } from '@store/rootReducer'
import { useColors } from '@theme/themeHooks'
import { heliumNFTs } from '@utils/solanaUtils'
import React, { useCallback } from 'react'
import { useAsync } from 'react-async-hook'
import { FlatList, RefreshControl } from 'react-native'
import { useSelector } from 'react-redux'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import CollectionItem, { Collection } from './CollectionItem'

const ManageCollectables = () => {
  const { t } = useTranslation()
  const { bottom } = useSafeAreaInsets()
  const colors = useColors()
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
      }
      if (!approved.includes(a.id) && approved.includes(b.id)) {
        return 1
      }
      return 0
    })

    return collectionItems
  }, [fetchAllCollectablesByGroup, approvedCollections])

  const {
    result: collectables,
    execute,
    loading,
  } = useAsync(async () => {
    return fetchSortedCollectables()
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
    [approvedCollections, collectables],
  )

  const keyExtractor = useCallback((item: Collection) => {
    return item.id
  }, [])

  return (
    <ScrollBox
      refreshControl={
        <RefreshControl
          enabled
          refreshing={loading}
          onRefresh={execute}
          title=""
          tintColor={colors.primaryText}
        />
      }
    >
      <BackScreen
        title={t('manageCollectables.title')}
        edges={[]}
        headerTopMargin="6xl"
      >
        <FlatList
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
