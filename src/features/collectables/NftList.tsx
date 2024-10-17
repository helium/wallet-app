import React, { useCallback, useEffect, useMemo } from 'react'
import { times } from 'lodash'
import { FlatList } from 'react-native-gesture-handler'
import { RefreshControl } from 'react-native'
import Box from '@components/Box'
import useCollectables from '@hooks/useCollectables'
import { useColors, useSpacing } from '@theme/themeHooks'
import { useNavigation } from '@react-navigation/native'
import { NavBarHeight } from '@components/ServiceNavBar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Config from '@assets/images/config.svg'
import Text from '@components/Text'
import { WalletNavigationProp } from '@services/WalletService/pages/WalletPage/WalletPageNavigator'
import ScrollBox from '@components/ScrollBox'
import { useSelector } from 'react-redux'
import { RootState } from '@store/rootReducer'
import NFTListItem, { NFTSkeleton } from './NftListItem'

const NftList = () => {
  const spacing = useSpacing()
  const { bottom } = useSafeAreaInsets()
  const navigation = useNavigation<WalletNavigationProp>()
  const approvedCollections = useSelector(
    (state: RootState) => state.collectables.approvedCollections,
  )

  const {
    collectables,
    loading: loadingCollectables,
    refresh,
  } = useCollectables()
  const { primaryText } = useColors()

  useEffect(() => {
    if (approvedCollections?.length > 0) {
      refresh()
    }
  }, [refresh, approvedCollections])

  const flatListItems = useMemo(() => {
    // always return an even number of items, if odd add an empty string
    if (Object.keys(collectables || []).length % 2 === 0) {
      return Object.keys(collectables || [])
    }

    return collectables ? Object.keys(collectables || []).concat(['']) : []
  }, [collectables])

  const renderItem = useCallback(
    ({
      item: token,
    }: {
      // eslint-disable-next-line react/no-unused-prop-types
      item: string
    }) => {
      if (token === '') {
        return <Box flex={1} />
      }
      return (
        <NFTListItem
          item={collectables[token][0]?.content?.metadata?.symbol}
          collectables={collectables[token]}
        />
      )
    },
    [collectables],
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

  const onManageNftList = useCallback(() => {
    navigation.navigate('ManageCollectables')
  }, [navigation])

  const renderFooterComponent = useCallback(() => {
    return (
      <TouchableOpacityBox
        onPress={onManageNftList}
        flexDirection="row"
        justifyContent="center"
        marginVertical="4"
      >
        <Config />
        <Text variant="textSmRegular" ml="2" fontWeight="500" color="gray.400">
          Manage NFTs
        </Text>
      </TouchableOpacityBox>
    )
  }, [onManageNftList])

  const keyExtractor = useCallback((item: string) => {
    return item
  }, [])

  const contentContainerStyle = useMemo(
    () => ({
      marginTop: spacing[4],
      paddingBottom: NavBarHeight + bottom + spacing['6xl'],
      paddingHorizontal: spacing[5],
      gap: spacing[4],
    }),
    [spacing, bottom],
  )

  return (
    <ScrollBox
      refreshControl={
        <RefreshControl
          refreshing={loadingCollectables}
          onRefresh={refresh}
          title=""
          tintColor={primaryText}
        />
      }
    >
      <FlatList
        enabled
        data={flatListItems}
        numColumns={2}
        columnWrapperStyle={{
          flexDirection: 'row',
          gap: spacing[4],
        }}
        contentContainerStyle={contentContainerStyle}
        renderItem={renderItem}
        ListEmptyComponent={renderEmptyComponent}
        keyExtractor={keyExtractor}
        ListFooterComponent={renderFooterComponent}
      />
    </ScrollBox>
  )
}

export default NftList
