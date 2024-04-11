/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-restricted-properties */
import BackArrow from '@assets/images/backArrow.svg'
import Hex from '@assets/images/hex.svg'
import { ReAnimatedBlurBox, ReAnimatedBox } from '@components/AnimatedBox'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import FabButton from '@components/FabButton'
import { DelayedFadeIn } from '@components/FadeInOut'
import Map from '@components/map/Map'
import { INITIAL_MAP_VIEW_STATE, MAX_MAP_ZOOM } from '@components/map/utils'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import {
  decodeEntityKey,
  init,
  iotInfoKey,
  keyToAssetForAsset,
  mobileInfoKey,
} from '@helium/helium-entity-manager-sdk'
import { chunks, truthy } from '@helium/spl-utils'
import useHotspots from '@hooks/useHotspots'
import { IotHotspotInfoV0 } from '@hooks/useIotInfo'
import { MobileHotspotInfoV0 } from '@hooks/useMobileInfo'
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
import { HotspotWithPendingRewards } from '../../types/solana'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { HotspotMapHotspotDetails } from './HotspotMapHotspotDetails'
import { HotspotMapLegend } from './HotspotMapLegend'

type Route = RouteProp<CollectableStackParamList, 'HotspotMapScreen'>

const HotspotMapScreen = () => {
  const { t } = useTranslation()
  const { anchorProvider } = useSolana()
  const route = useRoute<Route>()
  const { hotspot, network } = route.params || {}
  const bottomSheetStyle = useBackgroundStyle('surfaceSecondary')
  const navigation = useNavigation<CollectableNavigationProp>()
  const colors = useColors()
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const userLocationRef = useRef<MapLibreGL.UserLocation>(null)
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0)
  const [backEdges] = [['top']] as Edge[][]
  const [zoomLevel, setZoomLevel] = useState(INITIAL_MAP_VIEW_STATE.zoomLevel)
  const [networkType, setNetworkType] = useState<'IOT' | 'MOBILE'>(
    network || 'IOT',
  )
  const [loadingInfos, setLoadingInfos] = useState(false)
  const [hexInfoBuckets, setHexInfoBuckets] = useState<{
    [key: string]: IotHotspotInfoV0[] | MobileHotspotInfoV0[]
  }>({})
  const [activeHex, setActiveHex] = useState<string>()
  const [activeHotspotIndex, setActiveHotspotIndex] = useState(0)
  const [legendVisible, setLegendVisible] = useState(false)
  const { hotspotsWithMeta, fetchMore, fetchingMore, loading, onEndReached } =
    useHotspots()

  // - fetch all hotspots
  useEffect(() => {
    if (!loading && !fetchingMore && !onEndReached) {
      fetchMore(100)
    }
  }, [loading, fetchingMore, onEndReached, fetchMore])

  // - fetch infos by networkType for all hotspots
  // - setUp hexInfoBuckets
  useAsync(async () => {
    if (!loading && !fetchingMore && onEndReached && anchorProvider) {
      setLoadingInfos(true)
      const hemProgram = await init(anchorProvider)

      const infos = (
        await Promise.all(
          chunks(hotspotsWithMeta, 100).map(async (chunk) => {
            const keyToAssetKeys = chunk.map((h) =>
              keyToAssetForAsset(toAsset(h)),
            )
            const ktaAccs = await getCachedKeyToAssets(
              hemProgram,
              keyToAssetKeys,
            )

            const entityKeys = ktaAccs
              .map((kta) => {
                return decodeEntityKey(kta.entityKey, kta.keySerialization)
              })
              .filter(truthy)

            const infoKeys = entityKeys.map((ek) => {
              const keys = {
                IOT: iotInfoKey(IOT_CONFIG_KEY, ek)[0],
                MOBILE: mobileInfoKey(MOBILE_CONFIG_KEY, ek)[0],
              }

              return keys[networkType]
            })

            if (networkType === 'IOT') {
              return getCachedIotInfos(hemProgram, infoKeys)
            }

            if (networkType === 'MOBILE') {
              return getCachedMobileInfos(hemProgram, infoKeys)
            }
          }),
        )
      ).flat()

      const infoBuckets = infos
        .filter((info) => info && truthy(info.location))
        .reduce(
          (acc, info) => ({
            ...acc,
            ...(info?.location
              ? {
                  [info.location.toString()]: [
                    ...(acc[info.location.toString()] || []),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    info as any,
                  ],
                }
              : {}),
          }),
          {} as {
            [key: string]: IotHotspotInfoV0[] | MobileHotspotInfoV0[]
          },
        )

      setHexInfoBuckets(infoBuckets)
      setLoadingInfos(false)
    }
  }, [
    loading,
    fetchingMore,
    onEndReached,
    anchorProvider,
    networkType,
    hotspotsWithMeta,
    setLoadingInfos,
    setHexInfoBuckets,
  ])

  useAsync(async () => {
    // if hotspot is provided, check if it's IOT or MOBILE
    // scope networkType to the hotspot's network type
    if (onEndReached && !loadingInfos && anchorProvider && hotspot) {
      const hex = Object.entries(hexInfoBuckets).find(([_, infos]) =>
        infos.find((info) => info.asset.toBase58() === hotspot.id),
      )?.[0]

      if (hex) {
        setActiveHex(hex)
        setActiveHotspotIndex(
          hexInfoBuckets[hex].findIndex(
            (info) => info.asset.toBase58() === hotspot.id,
          ),
        )
      }
    }
  }, [anchorProvider, onEndReached, loadingInfos, hotspot])

  // - show bottom sheet when activeHex is set
  useEffect(() => {
    if (activeHex || legendVisible) {
      bottomSheetRef.current?.present()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [loadingInfos, activeHex, legendVisible, bottomSheetRef])

  // - center the map on the active hex
  useAsync(async () => {
    if (activeHex && mapRef?.current && bottomSheetHeight) {
      const cords = parseH3BNLocation(new BN(activeHex)).reverse()
      const mapHeight = mapRef.current.state.height

      if (mapHeight - bottomSheetHeight > 0) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const zoomLevel = await mapRef.current.getZoom()

        // Define the shift needed to adjust the map's center. This is set to a quarter of the bottom sheet's height.
        // This means the hexagon will be centered in the upper 3/4 of the map's viewable area.
        const centeringShift = bottomSheetHeight / 4

        // Convert the latitude to radians for more accurate calculations
        const latitudeRadians = (cords[1] * Math.PI) / 180

        // Calculate the number of meters per pixel at the current latitude and zoom level. This uses the Earth's
        // radius in meters and accounts for the zoom level to approximate how much geographic space each pixel covers.
        const metersPerPixel =
          (Math.cos(latitudeRadians) * 2 * Math.PI * 6378137) /
          (256 * 2 ** zoomLevel)

        // Calculate the shift in pixels needed to adjust the map's center based on the bottom sheet's height
        const pixelShift = centeringShift

        // Convert the pixel shift into a latitude degree shift, using the average meter per degree at the equator.
        const degreeShift = (pixelShift * metersPerPixel) / 111319.9

        // Adjust the map's center coordinate by subtracting the degree shift from the latitude. This effectively
        // moves the map's center up to account for the bottom sheet, ensuring the hexagon is centered in the
        // viewable area above the bottom sheet.
        cameraRef.current?.setCamera({
          centerCoordinate: [cords[0], cords[1] - degreeShift],
          animationDuration: 200,
        })
      }
    }
  }, [activeHex, mapRef, bottomSheetHeight, cameraRef])

  const iconSize = useMemo(() => zoomLevel * 0.02, [zoomLevel])
  const hexsFeature = useMemo(
    () =>
      featureCollection(
        Object.keys(hexInfoBuckets).map((h) =>
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
              iconSize,
            },
          ),
        ),
      ),
    [hexInfoBuckets, activeHex, networkType, iconSize],
  )

  const activeHexItem = useMemo(() => {
    if (!loadingInfos && activeHex) {
      const info = hexInfoBuckets[activeHex][activeHotspotIndex]

      return {
        hotspot: hotspotsWithMeta.find(
          (h) => h.content.metadata.asset_id === info.asset.toBase58(),
        ) as HotspotWithPendingRewards,
        info,
      }
    }
  }, [
    loadingInfos,
    hexInfoBuckets,
    activeHex,
    activeHotspotIndex,
    hotspotsWithMeta,
  ])

  const isLoading = useMemo(
    () => loading || fetchingMore || !onEndReached || loadingInfos,
    [loading, fetchingMore, onEndReached, loadingInfos],
  )

  const handleUserLocationPress = useCallback(() => {
    if (cameraRef?.current && userLocationRef?.current?.state.coordinates) {
      cameraRef.current.setCamera({
        animationDuration: 500,
        zoomLevel: MAX_MAP_ZOOM,
        centerCoordinate: userLocationRef.current.state.coordinates,
      })
    }
  }, [userLocationRef, cameraRef])

  const handleRegionChanged = useCallback(async () => {
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
                setActiveHex(undefined)
                setLegendVisible(false)
              },
              onRegionDidChange: handleRegionChanged,
            }}
          >
            {!isLoading && (
              <>
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
                <MapLibreGL.ShapeSource
                  id="hexsFeature"
                  hitbox={{ width: iconSize, height: iconSize }}
                  onPress={handleHexClick}
                  shape={hexsFeature}
                >
                  <MapLibreGL.SymbolLayer
                    id="hexs"
                    style={{
                      iconImage: ['get', 'iconImage'],
                      iconSize: ['get', 'iconSize'],
                      iconAllowOverlap: true,
                    }}
                  />
                </MapLibreGL.ShapeSource>
              </>
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
                {t('collectablesScreen.hotspots.map.back')}
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
                  {t('collectablesScreen.hotspots.map.type', {
                    type: networkType,
                  })}
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
            ref={bottomSheetRef}
            snapPoints={[]}
            enablePanDownToClose
            enableDynamicSizing
            animateOnMount
            index={0}
            backgroundStyle={bottomSheetStyle}
            handleIndicatorStyle={{ backgroundColor: colors.secondaryText }}
            onDismiss={() => setActiveHex(undefined)}
          >
            <BottomSheetScrollView>
              <Box
                onLayout={(e) => {
                  setBottomSheetHeight(e.nativeEvent.layout.height)
                }}
              >
                {legendVisible && <HotspotMapLegend network={networkType} />}
                {activeHexItem && (
                  <HotspotMapHotspotDetails
                    hotspot={activeHexItem.hotspot}
                    info={activeHexItem.info}
                    network={networkType}
                  />
                )}
              </Box>
            </BottomSheetScrollView>
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default HotspotMapScreen
