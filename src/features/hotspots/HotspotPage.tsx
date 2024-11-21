import Box from '@components/Box'
import ScrollBox from '@components/ScrollBox'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import useHotspots from '@hooks/useHotspots'
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshControl } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import SegmentedControl from '@components/SegmentedControl'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NavBarHeight } from '@components/ServiceNavBar'
import { Search } from '@components/Search'
import { Location, MarkerView } from '@rnmapbox/maps'
import ImageBox from '@components/ImageBox'
import CarotRight from '@assets/svgs/carot-right.svg'
import { getDistance } from 'geolib'
import { MOBILE_MINT, toNumber as heliumToNumber } from '@helium/spl-utils'
import { BN } from '@coral-xyz/anchor'
import { toNumber } from 'lodash'
import MiniMap from '@components/MiniMap'
import { HotspotNavigationProp } from '@services/HotspotService/pages/HotspotPage'
import { HotspotWithPendingRewards } from '../../types/solana'
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
  const navigation = useNavigation<HotspotNavigationProp>()
  const [filterText, setFilterText] = useState('')
  const [userLocation, setUserLocation] = useState<Location>()
  const [filter, setFilter] = useState<'distance' | 'earnings'>('distance')
  const route = useRoute<{
    params: {
      newHotspot?: HotspotWithPendingRewards | undefined
    }
    key: string
    name: string
  }>()

  const newHotspot = useMemo(() => route?.params?.newHotspot, [route])

  const onUserLocationUpdate = useCallback((location: Location) => {
    setUserLocation(location)
  }, [])

  const onItemSelected = useCallback((value: number) => {
    setFilter(value === 0 ? 'distance' : 'earnings')
  }, [])

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

  const onHotspotDetails = useCallback(
    (hotspot: HotspotWithPendingRewards) => () => {
      navigation.navigate('HotspotDetails', { hotspot })
    },
    [navigation],
  )

  const hotspotsWithDistance = useMemo(() => {
    let hotspots = hotspotsWithMeta

    if (newHotspot) {
      // we push the new hotspot to the top of the list and remove it from the array
      hotspots = [
        newHotspot,
        ...hotspots.filter((hotspot) => hotspot.id !== newHotspot.id),
      ]
    }

    return hotspots.map((hotspot) => {
      const subDao = hotspot?.content?.metadata?.hotspot_infos?.iot?.device_type
        ? 'iot'
        : 'mobile'
      const { long, lat } = hotspot.content.metadata.hotspot_infos[subDao]

      if (!long || !lat)
        return {
          ...hotspot,
          distance: undefined,
        }

      const distance = userLocation
        ? getDistance(
            {
              latitude: userLocation?.coords.latitude,
              longitude: userLocation?.coords.longitude,
            },
            {
              latitude: toNumber(lat),
              longitude: toNumber(long),
            },
          )
        : undefined

      return {
        ...hotspot,
        distance,
      }
    })
  }, [hotspotsWithMeta, userLocation, newHotspot])

  const filteredHotspots = useMemo(() => {
    const sortedHotspots = hotspotsWithDistance.sort((a, b) => {
      if (filter === 'distance') {
        // if distance is undefined, sort it to the end
        return (a?.distance ?? Infinity) - (b?.distance ?? Infinity)
      }
      return (
        (heliumToNumber(
          new BN(b?.pendingRewards?.[MOBILE_MINT?.toBase58()] ?? 0),
          6,
        ) ?? 0) -
        (heliumToNumber(
          new BN(a?.pendingRewards?.[MOBILE_MINT?.toBase58()] ?? 0),
          6,
        ) ?? 0)
      )
    })

    if (!filterText || filterText === '') {
      return sortedHotspots as (HotspotWithPendingRewards & {
        distance: number
      })[]
    }

    return sortedHotspots.filter((hotspot) => {
      return hotspot.content.metadata.name
        .toLowerCase()
        .includes(filterText.toLowerCase())
    }) as (HotspotWithPendingRewards & { distance: number })[]
  }, [hotspotsWithDistance, filterText, filter])

  const renderHeader = useCallback(() => {
    return (
      <Box gap="3xl" marginTop="2xl" marginBottom="md">
        <MiniMap onUserLocationUpdate={onUserLocationUpdate}>
          {hotspotsWithMeta.map((hotspot) => {
            const subDao = hotspot?.content?.metadata?.hotspot_infos?.iot
              ?.device_type
              ? 'iot'
              : 'mobile'
            const { long, lat } = hotspot.content.metadata.hotspot_infos[subDao]

            if (!long || !lat) return null

            return (
              <MarkerView
                id={hotspot.id}
                coordinate={[long, lat]}
                allowOverlapWithPuck
              >
                <ImageBox
                  source={require('@assets/images/hotspotBlackMarker.png')}
                />
              </MarkerView>
            )
          })}
        </MiniMap>
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
        >
          {t('HotspotPage.amountOfHotspots', {
            amount: hotspotsWithMeta?.length,
          })}
        </Text>
        <Box flex={1} alignItems="center">
          <SegmentedControl
            options={options}
            onItemSelected={onItemSelected}
            backgroundColor="bg.secondary-hover"
            padding="1"
            size="md"
          />
        </Box>
        <Search
          placeholder={t('HotspotPage.filter')}
          onChangeText={setFilterText}
          flex={1}
        />
      </Box>
    )
  }, [onUserLocationUpdate, hotspotsWithMeta, t, options, onItemSelected])

  const renderItem = useCallback(
    // eslint-disable-next-line react/no-unused-prop-types
    ({ item }: { item: HotspotWithPendingRewards & { distance: number } }) => {
      const isFirst = item.id === filteredHotspots[0].id
      const isLast =
        item.id === filteredHotspots[filteredHotspots.length - 1].id
      const borderTopStartRadius = isFirst ? '3xl' : undefined
      const borderTopEndRadius = isFirst ? '3xl' : undefined
      const borderBottomStartRadius = isLast ? '3xl' : undefined
      const borderBottomEndRadius = isLast ? '3xl' : undefined

      const { name } = item.content.metadata

      const isActive = item?.content?.metadata?.hotspot_infos?.iot?.is_activ

      const isNewHotspot = item.id === newHotspot?.id

      const distance = item?.distance

      // if distance is less than 5 meters, show 'Nearby'
      let distanceText = t('HotspotPage.distanceNotAvailable')

      if (distance && distance < 5) {
        distanceText = t('HotspotPage.nearby')
      } else if (distance) {
        distanceText = t('HotspotPage.metersAway', {
          meters: distance,
        })
      }

      return (
        <TouchableContainer
          borderTopStartRadius={borderTopStartRadius}
          borderTopEndRadius={borderTopEndRadius}
          borderBottomStartRadius={borderBottomStartRadius}
          borderBottomEndRadius={borderBottomEndRadius}
          marginBottom={!isLast ? 'xxs' : undefined}
          onPress={onHotspotDetails(item)}
          flexDirection="row"
          alignItems="center"
        >
          <Box padding="xl" gap="sm" flex={1}>
            <Box flexDirection="row" gap="sm" alignItems="center">
              <Box
                backgroundColor={isActive ? 'green.light-500' : 'fg.senary-300'}
                borderRadius="full"
                width={13.98}
                height={13.98}
              />
              <Text variant="textLgSemibold" color="primaryText">
                {name}
              </Text>
            </Box>
            <Text variant="textSmRegular" color="text.placeholder">
              {distanceText}
            </Text>
          </Box>
          <Box marginEnd="xl" flexDirection="row" gap="lg" alignItems="center">
            {isNewHotspot && (
              <Box
                backgroundColor="primaryText"
                borderRadius="full"
                paddingVertical="1"
                paddingHorizontal="1.5"
              >
                <Text variant="textSmSemibold" color="primaryBackground">
                  {t('HotspotPage.new')}
                </Text>
              </Box>
            )}
            <CarotRight color={colors['fg.quaternary-500']} />
          </Box>
        </TouchableContainer>
      )
    },
    [filteredHotspots, onHotspotDetails, newHotspot, t, colors],
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

  const keyExtractor = useCallback(
    (item: HotspotWithPendingRewards & { distance: number }) => {
      return item.id
    },
    [],
  )

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
          data={filteredHotspots}
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
