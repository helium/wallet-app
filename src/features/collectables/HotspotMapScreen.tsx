import BackArrow from '@assets/images/backArrow.svg'
import Hex from '@assets/images/hex.svg'
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
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { INITIAL_MAP_VIEW_STATE, MAX_MAP_ZOOM } from '@components/map/utils'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
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
import OnPressEvent from '@maplibre/maplibre-react-native/javascript/types/OnPressEvent'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useBackgroundStyle, useColors } from '@theme/themeHooks'
import { Point, feature, featureCollection } from '@turf/helpers'
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
import { HotspotMapLegend } from './HotspotMapLegend'

type Route = RouteProp<CollectableStackParamList, 'HotspotMapScreen'>

// TODO:
// When a hotspot is passed in as a param
// Determine if it has a iotInfo or mobileInfo
// Based on that set the networkType and then find hex it belongs too
// From the hexBuckets and setActiveHex to that and activeHotspot to the passed in hotspot
// Desired data structure
// { hex: [hotspot1, hotspot2, hotspot3] }

const HotspotMapScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { hotspot } = route.params || {}
  const { anchorProvider } = useSolana()
  const colors = useColors()
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const userLocationRef = useRef<MapLibreGL.UserLocation>(null)
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const bottomSheetStyle = useBackgroundStyle('surfaceSecondary')
  const navigation = useNavigation<CollectableNavigationProp>()
  const [safeEdges, backEdges] = [['bottom'], ['top']] as Edge[][]
  const [zoomLevel, setZoomLevel] = useState(INITIAL_MAP_VIEW_STATE.zoomLevel)
  const [networkType, setNetworkType] = useState<'IOT' | 'MOBILE'>('IOT')
  const [loadingInfos, setLoadingInfos] = useState(false)
  const [hexBuckets, setHexBuckets] = useState<{ [key: string]: string[] }>({})
  const [activeHex, setActiveHex] = useState(null)
  const [activeHotspot, setActiveHotspot] = useState(null)
  const [legendVisible, setLegendVisible] = useState(false)
  const snapPoints = useMemo(
    () => (legendVisible ? [120, 120] : ['55%', '55%', '90%']),
    [legendVisible],
  )
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

      // TODO: Properly chunk the hotspots to buckets.
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
            }[networkType]),
        )

        const infos = await {
          IOT: getCachedIotInfos(hemProgram, infoKeys),
          MOBILE: getCachedMobileInfos(hemProgram, infoKeys),
        }[networkType]

        setHexBuckets(
          infos.reduce(
            (acc: { [key: string]: string[] }, i) => ({
              ...acc,
              ...(i.location
                ? {
                    [i.location.toString()]: [
                      ...(acc[i.location.toString()] || []),
                      // TODO: actualy set the hotspot here
                      '0',
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
    networkType,
    hotspotsWithMeta,
    setLoadingInfos,
    setHexBuckets,
  ])

  const hexsFeature = useMemo(
    () =>
      featureCollection(
        Object.keys(hexBuckets).map((h) =>
          feature(
            {
              type: 'Point',
              coordinates: parseH3BNLocation(new BN(h)).reverse(),
            } as Point,
            {
              id: h,
              iconImage:
                h === activeHex
                  ? `${networkType.toLowerCase()}HexActive`
                  : `${networkType.toLowerCase()}Hex`,
              iconSize: zoomLevel * 0.02,
            },
          ),
        ),
      ),
    [hexBuckets, activeHex, networkType, zoomLevel],
  )

  useEffect(() => {
    if (activeHex || legendVisible) {
      if (activeHex) {
        const cords = parseH3BNLocation(new BN(activeHex)).reverse()
        cameraRef.current?.setCamera({
          centerCoordinate: [
            cords[0],
            // TODO: figure out proper offset for centerCoordiantes based on zoomLevel and drawer height
            cords[1] - (MAX_MAP_ZOOM - zoomLevel) * 0.02,
          ],
        })
      }
      bottomSheetModalRef.current?.present()
    } else {
      bottomSheetModalRef.current?.dismiss()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHex, legendVisible, cameraRef])

  const handleUserLocationPress = useCallback(() => {
    if (cameraRef?.current && userLocationRef?.current?.state.coordinates) {
      cameraRef.current.setCamera({
        animationDuration: 500,
        zoomLevel: MAX_MAP_ZOOM,
        centerCoordinate: userLocationRef.current.state.coordinates,
      })
    }
  }, [userLocationRef, cameraRef])

  const handleRegionIsChanging = useCallback(async () => {
    // TODO: Maybe throttle this
    if (mapRef?.current) {
      const zoom = await mapRef.current.getZoom()
      if (zoomLevel !== zoom) {
        setZoomLevel(zoom)
      }
    }
  }, [mapRef, zoomLevel, setZoomLevel])

  const handleLegendPress = useCallback(() => {
    setLegendVisible(true)
  }, [setLegendVisible])

  const handleToggleNetwork = useCallback(() => {
    setNetworkType(networkType === 'IOT' ? 'MOBILE' : 'IOT')
  }, [networkType, setNetworkType])

  const handleHexClick = useCallback(
    (event: OnPressEvent) => {
      const hex = event.features[0]
      setLegendVisible(false)
      setActiveHex(hex.properties?.id)
    },
    [setActiveHex, setLegendVisible],
  )

  const isLoading = useMemo(
    () => loading || fetchingMore || !onEndReached || loadingInfos,
    [loading, fetchingMore, onEndReached, loadingInfos],
  )

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
          <Map
            map={mapRef}
            camera={cameraRef}
            userLocation={userLocationRef}
            mapProps={{
              onPress: () => {
                setActiveHex(null)
                setLegendVisible(false)
              },
              onRegionIsChanging: handleRegionIsChanging,
            }}
          >
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <MapLibreGL.Images
              images={{
                iotHex: require('@assets/images/mapIotHex.png'),
                iotHexActive: require('@assets/images/mapIotHexActive.png'),
                mobileHex: require('@assets/images/mapMobileHex.png'),
                mobileHexActive: require('@assets/images/mapMobileHexActive.png'),
              }}
            />
            {!isLoading && (
              <MapLibreGL.ShapeSource
                id="hexsFeature"
                onPress={handleHexClick}
                shape={hexsFeature}
              >
                <MapLibreGL.SymbolLayer
                  id="hexs"
                  style={{
                    iconImage: ['get', 'iconImage'],
                    iconSize: ['get', 'iconSize'],
                    iconAllowOverlap: false,
                  }}
                />
              </MapLibreGL.ShapeSource>
            )}
          </Map>
          <Box
            flexDirection="row"
            alignItems="center"
            position="absolute"
            width="100%"
            paddingTop="l"
            paddingLeft="ms"
            top={0}
          >
            <TouchableOpacityBox
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              onPress={() => navigation.goBack()}
            >
              <BackArrow color="white" />
              <Text variant="subtitle3" color="white" marginLeft="ms">
                Back to Hotspot List
              </Text>
            </TouchableOpacityBox>
          </Box>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            position="absolute"
            width="100%"
            bottom={10}
          >
            <Box marginHorizontal="ms">
              <TouchableOpacityBox
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                backgroundColor={networkType === 'IOT' ? 'green950' : 'blue950'}
                paddingRight="ms"
                paddingLeft="s"
                paddingVertical="sx"
                borderRadius="round"
                opacity={0.8}
                activeOpacity={1}
                onPress={handleToggleNetwork}
              >
                <Hex
                  width={24}
                  height={24}
                  color={
                    networkType === 'IOT' ? colors.green500 : colors.blue500
                  }
                />
                <Text
                  marginLeft="sx"
                  color={networkType === 'IOT' ? 'green500' : 'blue500'}
                >
                  {networkType} Hotspots
                </Text>
              </TouchableOpacityBox>
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
                // TODO: Make this visible when modled coverage is available
                visible={false}
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
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={1}
            snapPoints={snapPoints}
            backgroundStyle={bottomSheetStyle}
            handleIndicatorStyle={{ backgroundColor: colors.secondaryText }}
            onDismiss={() => setActiveHex(null)}
          >
            <BottomSheetView>
              {legendVisible && <HotspotMapLegend network={networkType} />}
              {activeHex && (
                <>
                  <Text color="white">
                    Total Hotspots: {Object.values(hexBuckets).flat().length}
                  </Text>
                  <Text color="white">Active Hex: {activeHex}</Text>
                  <Text color="white">
                    Hotspots In Hex: {hexBuckets[activeHex]?.length}{' '}
                  </Text>
                </>
              )}
            </BottomSheetView>
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default HotspotMapScreen
