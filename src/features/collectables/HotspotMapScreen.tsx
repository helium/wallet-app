import {
  Box,
  CircleLoader,
  DelayedFadeIn,
  FabButton,
  Map,
  ReAnimatedBlurBox,
  ReAnimatedBox,
  SafeAreaBox,
  Text,
} from '@components'
import { MAX_MAP_ZOOM } from '@components/map/utils'
import {
  decodeEntityKey,
  init,
  iotInfoKey,
  keyToAssetForAsset,
  mobileInfoKey,
} from '@helium/helium-entity-manager-sdk'
import { featureCollection, feature, Point } from '@turf/helpers'
import { chunks } from '@helium/spl-utils'
import useHotspots from '@hooks/useHotspots'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { IOT_CONFIG_KEY, MOBILE_CONFIG_KEY } from '@utils/constants'
import { parseH3BNLocation } from '@utils/h3'
import {
  getCachedIotInfos,
  getCachedKeyToAssets,
  getCachedMobileInfos,
  toAsset,
} from '@utils/solanaUtils'
import { BN } from 'bn.js'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

type Route = RouteProp<CollectableStackParamList, 'HotspotMapScreen'>

const HotspotMapScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { hotspot } = route.params || {}
  const { anchorProvider } = useSolana()
  const camera = useRef<MapLibreGL.Camera>(null)
  const userLocation = useRef<MapLibreGL.UserLocation>(null)
  const navigation = useNavigation<CollectableNavigationProp>()
  const [safeEdges, backEdges] = [['bottom'], ['top']] as Edge[][]
  const [hotspotType, setHotspotType] = useState<'IOT' | 'MOBILE'>('IOT')
  const [loadingInfos, setLoadingInfos] = useState(false)
  const [hexBuckets, setHexBuckets] = useState<{ [key: string]: string[] }>({})
  const [selectedHex, setSelectedHex] = useState()
  const [selectedHotspot, setSelectedHotspot] = useState()
  const { hotspotsWithMeta, fetchMore, fetchingMore, loading, onEndReached } =
    useHotspots()

  useEffect(() => {
    if (!loading && !fetchingMore && !onEndReached) {
      fetchMore(100)
    }
  }, [loading, fetchingMore, fetchMore, onEndReached])

  useAsync(async () => {
    if (!loading && !fetchingMore && onEndReached && anchorProvider) {
      setLoadingInfos(true)
      const hemProgram = await init(anchorProvider)

      // eslint-disable-next-line no-restricted-syntax
      for (const chunk of chunks(hotspotsWithMeta, 25)) {
        const keyToAssetKeys = chunk.map((h) => keyToAssetForAsset(toAsset(h)))
        const ktaAccs = await getCachedKeyToAssets(hemProgram, keyToAssetKeys)
        const entityKeys = ktaAccs.map(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          (kta) => decodeEntityKey(kta.entityKey, kta.keySerialization)!,
        )

        const infoKeys = entityKeys.map(
          (ek) =>
            ({
              IOT: iotInfoKey(IOT_CONFIG_KEY, ek)[0],
              MOBILE: mobileInfoKey(MOBILE_CONFIG_KEY, ek)[0],
            }[hotspotType]),
        )

        const infos = await {
          IOT: getCachedIotInfos(hemProgram, infoKeys),
          MOBILE: getCachedMobileInfos(hemProgram, infoKeys),
        }[hotspotType]

        setHexBuckets(
          infos.reduce(
            (acc: { [key: string]: string[] }, i) => ({
              ...acc,
              ...(i.location
                ? {
                    [i.location.toString()]: [
                      ...(acc[i.location.toString()] || []),
                      'test',
                    ],
                  }
                : {}),
            }),
            {},
          ),
        )

        setLoadingInfos(false)
      }
    }
  }, [
    loading,
    fetchingMore,
    onEndReached,
    anchorProvider,
    hotspotType,
    hotspotsWithMeta,
    setLoadingInfos,
    setHexBuckets,
  ])

  const hexsFeature = useMemo(
    () =>
      featureCollection(
        Object.keys(hexBuckets).map((h) =>
          feature({
            type: 'Point',
            coordinates: parseH3BNLocation(new BN(h)).reverse(),
          } as Point),
        ),
      ),
    [hexBuckets],
  )

  const isLoading = useMemo(
    () => loading || fetchingMore || !onEndReached || loadingInfos,
    [loading, fetchingMore, onEndReached, loadingInfos],
  )

  const handleUserLocationPress = useCallback(() => {
    if (camera?.current && userLocation?.current?.state.coordinates) {
      camera.current.setCamera({
        animationDuration: 500,
        zoomLevel: MAX_MAP_ZOOM,
        centerCoordinate: userLocation.current.state.coordinates,
      })
    }
  }, [userLocation, camera])

  const handleLegendPress = useCallback(() => {
    console.log('TODO: Implement handleLegendPress')
  }, [])

  const handleToggleType = useCallback(() => {
    setHotspotType(hotspotType === 'IOT' ? 'MOBILE' : 'IOT')
  }, [hotspotType, setHotspotType])

  const handleHexClick = (event) => {
    // You can access the clicked hexagon properties through event.features
    console.log('Clicked on hexagon', event.features)
  }

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <SafeAreaBox edges={backEdges} flex={1}>
        <Box
          flexGrow={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="surfaceSecondary"
          overflow="hidden"
          position="relative"
        >
          <ReAnimatedBlurBox
            visible={isLoading}
            exiting={DelayedFadeIn}
            position="absolute"
            width="100%"
            height="100%"
            justifyContent="center"
            alignItems="center"
            zIndex={100}
          >
            <CircleLoader loaderSize={24} color="white" />
          </ReAnimatedBlurBox>
          <Map camera={camera} userLocation={userLocation}>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <MapLibreGL.Images
              images={{
                iotHex: require('@assets/images/mapIotHex.png'),
                mobileHex: require('@assets/images/mapMobileHex.png'),
              }}
            />
            <MapLibreGL.ShapeSource
              id="hexsFeature"
              onPress={handleHexClick}
              shape={hexsFeature}
            >
              <MapLibreGL.SymbolLayer
                id="hexs"
                style={{
                  iconImage: hotspotType === 'IOT' ? 'iotHex' : 'mobileHex',
                  iconOpacity: 0.6,
                  iconAllowOverlap: false,
                }}
              />
            </MapLibreGL.ShapeSource>
          </Map>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            position="absolute"
            width="100%"
            top={20}
          >
            <Box flexDirection="row" alignItems="center" marginHorizontal="ms">
              <Text variant="body1">{'< Back to Hotspot List'}</Text>
            </Box>
          </Box>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            position="absolute"
            width="100%"
            bottom={10}
          >
            <Box flexDirection="row" alignItems="center" marginHorizontal="ms">
              <FabButton
                backgroundColor="white"
                backgroundColorOpacity={0.3}
                backgroundColorOpacityPressed={0.5}
                justifyContent="center"
                size={36}
                title="Iot Hotspots"
                onPress={handleToggleType}
              />
            </Box>
            <Box flexDirection="row" alignItems="center" marginHorizontal="ms">
              <FabButton
                icon="questionMark"
                backgroundColor="white"
                backgroundColorOpacity={0.3}
                backgroundColorOpacityPressed={0.5}
                marginRight="ms"
                width={36}
                height={36}
                justifyContent="center"
                onPress={handleLegendPress}
              />
              <FabButton
                icon="mapUserLocation"
                backgroundColor="white"
                backgroundColorOpacity={0.3}
                backgroundColorOpacityPressed={0.5}
                width={36}
                height={36}
                justifyContent="center"
                onPress={handleUserLocationPress}
              />
            </Box>
          </Box>
        </Box>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default HotspotMapScreen
