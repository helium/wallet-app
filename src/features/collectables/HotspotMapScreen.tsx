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
import { chunks } from '@helium/spl-utils'
import useHotspots from '@hooks/useHotspots'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { featureCollection, polygon } from '@turf/helpers'
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

const calculateHexagonVertices = (center: [number, number], radius: number) => {
  const vertices = []
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i // Hexagon angle offset
    const angleRad = (Math.PI / 180) * angleDeg
    vertices.push([
      center[0] + radius * Math.cos(angleRad),
      center[1] + radius * Math.sin(angleRad),
    ])
  }
  vertices.push(vertices[0]) // Close the polygon by repeating the first vertex
  return vertices
}

// Function to create a hexagon FeatureCollection from an array of { location: number[] }
const createHexagonFeatureCollection = (
  hexes: { location: number[] }[],
  hexRadius: number,
) => {
  const hexagonFeatures = hexes.map(({ location }) => {
    const hexagonVertices = calculateHexagonVertices(
      [location[1], location[0]],
      hexRadius,
    )
    return polygon([hexagonVertices], {})
  })

  return featureCollection(hexagonFeatures)
}

const HotspotMapScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { hotspot } = route.params || {}
  const { anchorProvider } = useSolana()
  const camera = useRef<MapLibreGL.Camera>(null)
  const userLocation = useRef<MapLibreGL.UserLocation>(null)
  const navigation = useNavigation<CollectableNavigationProp>()
  const [safeEdges, backEdges] = [['bottom'], ['top']] as Edge[][]
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

        const type = 'IOT'
        const infoKeys = entityKeys.map(
          (ek) =>
            ({
              IOT: iotInfoKey(IOT_CONFIG_KEY, ek)[0],
              MOBILE: mobileInfoKey(MOBILE_CONFIG_KEY, ek)[0],
            }[type]),
        )

        const infos =
          type === 'IOT'
            ? await getCachedIotInfos(hemProgram, infoKeys)
            : await getCachedMobileInfos(hemProgram, infoKeys)

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
    hotspotsWithMeta,
    setLoadingInfos,
    setHexBuckets,
  ])

  const hexsFeature = useMemo(() => {
    return createHexagonFeatureCollection(
      Object.keys(hexBuckets).map((h) => ({
        location: parseH3BNLocation(new BN(h)),
      })),
      0.0005,
    )
  }, [hexBuckets])

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
    console.log('TODO: Implement handleToggleType')
  }, [])

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
            <MapLibreGL.ShapeSource
              id="hexagons"
              shape={hexsFeature}
              onPress={handleHexClick}
            >
              <MapLibreGL.FillLayer
                id="hexagonLayer"
                style={{
                  fillColor: '#3B82F6',
                  fillOpacity: 0.7,
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
