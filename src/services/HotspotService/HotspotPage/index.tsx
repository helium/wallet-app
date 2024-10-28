import Box from '@components/Box'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import useHotspots from '@hooks/useHotspots'
import { useIsFocused } from '@react-navigation/native'
import { useColors, useSpacing } from '@theme/themeHooks'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import animalHash from 'angry-purple-tiger'
import SegmentedControl from '@components/SegmentedControl'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NavBarHeight } from '@components/ServiceNavBar'
import { HotspotWithPendingRewards } from '../../../types/solana'
import MiniMap from './MiniMap'
import EmptyState from './EmptyState'

const HotspotPage = () => {
  const {
    hotspotsWithMeta,
    loading: loadingHotspots,
    refresh,
    fetchMore,
    fetchingMore,
    onEndReached,
  } = useHotspots()

  const isFocused = useIsFocused()
  const colors = useColors()
  const { t } = useTranslation()
  const spacing = useSpacing()
  const { bottom } = useSafeAreaInsets()

  const options = useMemo(
    () => [
      {
        label: t('HotspotPage.byDistance'),
        value: 'distance',
      },
      {
        label: t('HotspotPage.byEarnings'),
        value: 'earnings',
      },
    ],
    [t],
  )

  const renderHeader = useCallback(() => {
    return (
      <Box gap="3xl" alignItems="center" marginTop="2xl" marginBottom="3xl">
        <MiniMap />
        <Text variant="displayMdSemibold" color="primaryText">
          {t('HotspotPage.amountOfHotspots', {
            amount: hotspotsWithMeta?.length,
          })}
        </Text>
        <SegmentedControl
          options={options}
          onItemSelected={() => {}}
          backgroundColor="bg.secondary-hover"
          padding="1"
        />
      </Box>
    )
  }, [t, hotspotsWithMeta, options])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: HotspotWithPendingRewards }) => {
      const isFirst = item.id === hotspotsWithMeta[0].id
      const isLast =
        item.id === hotspotsWithMeta[hotspotsWithMeta.length - 1].id
      const borderTopStartRadius = isFirst ? '3xl' : undefined
      const borderTopEndRadius = isFirst ? '3xl' : undefined
      const borderBottomStartRadius = isLast ? '3xl' : undefined
      const borderBottomEndRadius = isLast ? '3xl' : undefined

      return (
        <TouchableContainer
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
          marginBottom={!isLast ? 'xxs' : undefined}
        >
          <Box padding="xl">
            <Text variant="textLgSemibold" color="primaryText">
              {animalHash(item.id)}
            </Text>
            <Text variant="textSmRegular" color="blue.500">
              500m away
            </Text>
          </Box>
        </TouchableContainer>
      )
    },
    [hotspotsWithMeta],
  )

  const pageAmount = 20
  const handleOnEndReached = useCallback(() => {
    if (!fetchingMore && isFocused && !onEndReached) {
      fetchMore(pageAmount)
    }
  }, [fetchingMore, isFocused, fetchMore, pageAmount, onEndReached])

  const handleRefresh = useCallback(() => {
    refresh(pageAmount)
  }, [pageAmount, refresh])

  const keyExtractor = useCallback((item: HotspotWithPendingRewards) => {
    return item.id
  }, [])

  const contentContainerStyle = useMemo(() => {
    return {
      paddingHorizontal: spacing['2xl'],
      paddingBottom: bottom + NavBarHeight + spacing.xl,
    }
  }, [spacing, bottom])

  return (
    <>
      {hotspotsWithMeta.length === 0 ? <EmptyState /> : null}

      <ScrollBox
        contentContainerStyle={{
          flex: 1,
        }}
        refreshControl={
          <RefreshControl
            enabled
            refreshing={loadingHotspots}
            onRefresh={handleRefresh}
            title=""
            tintColor={colors.primaryText}
          />
        }
      >
        <FlatList
          contentContainerStyle={contentContainerStyle}
          data={hotspotsWithMeta}
          renderItem={renderItem}
          onEndReachedThreshold={0.001}
          onEndReached={handleOnEndReached}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
        />
      </ScrollBox>
    </>
  )
}

export default HotspotPage
