import React, { useCallback, useMemo } from 'react'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useColors } from '../../theme/themeHooks'
import Box from '../../components/Box'
import useCollectables from '../../utils/useCollectables'
import { CollectableSkeleton } from './NftListItem'
import { Collectable } from '../../types/solana'
import { CollectableNavigationProp } from './collectablesTypes'
import HotspotListItem from './HotspotListItem'
import ButtonPressable from '../../components/ButtonPressable'

const HotspotList = () => {
  const { bottom } = useSafeAreaInsets()
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()

  const {
    collectables,
    collectablesWithMeta,
    loading: loadingCollectables,
    refresh,
  } = useCollectables()

  const bottomSpace = useMemo(() => bottom * 2, [bottom])
  const { primaryText } = useColors()

  const flatListItems = useMemo(() => {
    if (collectablesWithMeta.HOTSPOT) {
      return collectablesWithMeta.HOTSPOT
    }
    return []
  }, [collectablesWithMeta])

  const handleNavigateToCollectable = useCallback(
    (collectable: Collectable) => {
      navigation.navigate('HotspotDetailsScreen', { collectable })
    },
    [navigation],
  )

  const renderHeader = useCallback(() => {
    return (
      <ButtonPressable
        style={{ flexBasis: 0 }}
        flexGrow={1}
        marginTop="m"
        borderRadius="round"
        backgroundColor="white"
        backgroundColorOpacityPressed={0.7}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        titleColorDisabled="white"
        title={t('collectablesScreen.hotspots.claimAllRewards')}
        titleColor="black"
        fontWeight="bold"
        marginBottom="m"
        marginHorizontal="l"
      />
    )
  }, [t])

  const renderCollectable = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: Collectable }) => {
      return (
        <HotspotListItem hotspot={item} onPress={handleNavigateToCollectable} />
      )
    },
    [handleNavigateToCollectable],
  )

  const renderEmptyComponent = useCallback(() => {
    if (!loadingCollectables) return null

    if (loadingCollectables && collectables.HOTSPOT) {
      return (
        <Box flex={1} flexDirection="row">
          {times(collectables.HOTSPOT.length).map((i) => (
            <CollectableSkeleton key={i} />
          ))}
        </Box>
      )
    }

    return null
  }, [collectables, loadingCollectables])

  const keyExtractor = useCallback((item: Collectable) => {
    return item.address.toString()
  }, [])

  const contentContainerStyle = useMemo(
    () => ({
      paddingBottom: bottomSpace,
    }),
    [bottomSpace],
  )

  return (
    <FlatList
      data={flatListItems}
      numColumns={2}
      columnWrapperStyle={{
        flexDirection: 'row',
      }}
      ListHeaderComponent={renderHeader}
      refreshControl={
        <RefreshControl
          enabled
          refreshing={loadingCollectables}
          onRefresh={refresh}
          title=""
          tintColor={primaryText}
        />
      }
      contentContainerStyle={contentContainerStyle}
      renderItem={renderCollectable}
      ListEmptyComponent={renderEmptyComponent}
      keyExtractor={keyExtractor}
    />
  )
}

export default HotspotList
