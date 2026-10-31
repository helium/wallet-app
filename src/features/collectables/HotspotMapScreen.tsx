import HexArt from '@assets/images/hex.svg'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import useHotspots from '@hooks/useHotspots'
import * as MapLibreRN from '@maplibre/maplibre-react-native'
import { GeoJSONSource } from '@maplibre/maplibre-react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { FADE_OUT_STATE } from '@theme/motion'
import { Polygon, feature, featureCollection } from '@turf/helpers'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { SheetBackground, SheetHandle } from '@ui/Sheet'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { parseH3BNLocation } from '@utils/h3'
import { BN } from 'bn.js'
import { BlurView } from 'expo-blur'
import { cellToBoundary, latLngToCell } from 'h3-js'
import { ChevronLeft, CircleHelp, LocateFixed } from 'lucide-react-native'
import React, {
  ComponentProps,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { useCSSVariable, withUniwind } from 'uniwind'
import { useDebounce } from 'use-debounce'
import { useSolana } from '../../solana/SolanaProvider'
import { HotspotWithPendingRewards } from '../../types/solana'
import { HotspotMapHotspotDetails } from './HotspotMapHotspotDetails'
import { HotspotMapLegend } from './HotspotMapLegend'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { HexInfoBuckets, hotspotMapInfosQuery } from './hotspotMapInfosQuery'
import Map from './map/Map'
import { INITIAL_MAP_VIEW_STATE, MAX_MAP_ZOOM } from './map/utils'

const SafeArea = withUniwind(SafeAreaView)
const AnimatedBlurView = withUniwind(Animated.createAnimatedComponent(BlurView))
const Hex = withUniwind(HexArt)
const BackIcon = withUniwind(ChevronLeft)
const LegendIcon = withUniwind(CircleHelp)
const UserLocationIcon = withUniwind(LocateFixed)

type Route = RouteProp<CollectableStackParamList, 'HotspotMapScreen'>
type OnPress = NonNullable<
  Pick<ComponentProps<typeof GeoJSONSource>, 'onPress'>['onPress']
>

const BACK_EDGES: Edge[] = ['top']
const DEFAULT_HEX = '631210968843200500' // used for when a hotspot has no iotInfo or mobileInfo
const NO_HEX_INFO_BUCKETS: HexInfoBuckets = {}
const HotspotMapScreen = () => {
  const { t } = useTranslation()
  const { anchorProvider } = useSolana()
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  // MapLibre takes the hex fill as a colour value, not a class.
  const [mobileHexColor, iotHexColor] = useCSSVariable([
    '--color-blue-dark-500',
    '--color-success-500',
  ])
  const mapRef = useRef<MapLibreRN.MapRef>(null)
  const cameraRef = useRef<MapLibreRN.CameraRef>(null)
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const [bottomSheetHeight, setBottomSheetHeight] = useState(0)
  const [bottomSheetSnapIndex, setBottomSheetSnapIndex] = useState(-1)
  const [zoomLevel, setZoomLevel] = useState(INITIAL_MAP_VIEW_STATE.zoomLevel)
  const [hotspot, setHotspot] = useState(route.params?.hotspot)
  const [networkType, setNetworkType] = useState<'IOT' | 'MOBILE'>(
    route.params?.network || 'IOT',
  )
  const [activeHex, setActiveHex] = useState<string>()
  const [activeHotspotIndex, setActiveHotspotIndex] = useState(0)
  const [legendVisible, setLegendVisible] = useState(false)
  const { hotspots, fetchAll, loading, onEndReached } = useHotspots()
  const [initialUserLocation, setInitialUserLocation] = useState<number[]>()
  const initialCenterSet = useRef(false)
  const userLocation = MapLibreRN.useCurrentPosition()
  const userCoords = userLocation?.coords
  if (!initialUserLocation && userCoords) {
    setInitialUserLocation([userCoords.longitude, userCoords.latitude])
  }

  const initialCenter =
    initialUserLocation || INITIAL_MAP_VIEW_STATE.centerCoordinate

  useEffect(() => {
    if (
      initialCenter &&
      JSON.stringify(initialCenter) !==
        JSON.stringify(INITIAL_MAP_VIEW_STATE.centerCoordinate) &&
      !initialCenterSet.current
    ) {
      initialCenterSet.current = true
      void cameraRef.current?.setStop({
        center: initialCenter as MapLibreRN.LngLat,
        duration: 0,
      })
    }
  }, [initialCenter, cameraRef])

  // - fetch all hotspots
  useEffect(() => {
    if (!loading && !onEndReached) {
      fetchAll()
    }
  }, [loading, onEndReached, fetchAll])

  // - fetch infos by networkType for all hotspots
  // - setUp hexInfoBuckets
  const {
    data: hexInfoBuckets = NO_HEX_INFO_BUCKETS,
    isLoading: loadingInfos,
  } = useQuery(
    hotspotMapInfosQuery({
      anchorProvider,
      networkType,
      hotspots,
      enabled: onEndReached,
    }),
  )

  useEffect(() => {
    // if hotspot is provided, check if it's IOT or MOBILE
    // scope networkType to the hotspot's network type
    if (hotspot) {
      if (onEndReached && !loadingInfos && anchorProvider) {
        const [hex] = Object.entries(hexInfoBuckets).find(([_, infos]) => {
          return infos.some((info) => info?.asset.toBase58() === hotspot.id)
        }) || [DEFAULT_HEX]

        // eslint-disable-next-line react-hooks/set-state-in-effect -- selects the hex of the given hotspot once the map infos load
        setActiveHex(hex)
        if (hex !== DEFAULT_HEX) {
          setActiveHotspotIndex(
            hexInfoBuckets[hex].findIndex(
              (info) => info.asset.toBase58() === hotspot.id,
            ),
          )
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorProvider, onEndReached, loadingInfos, hotspot])

  // - show bottom sheet when activeHex is set
  useEffect(() => {
    if (activeHex || legendVisible) {
      bottomSheetRef.current?.present()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [loadingInfos, activeHex, hotspot, legendVisible, bottomSheetRef])

  // - center the map on the active hex
  useEffect(() => {
    const centerOnHex = async () => {
      if (
        activeHex &&
        activeHex !== DEFAULT_HEX &&
        mapRef?.current &&
        bottomSheetHeight
      ) {
        const cords = parseH3BNLocation(new BN(activeHex)).reverse()

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
        void cameraRef.current?.setStop({
          center: [cords[0], cords[1] - degreeShift],
          duration: 200,
          easing: 'ease',
        })
      }
    }
    centerOnHex().catch((e) => console.error(e))
  }, [activeHex, mapRef, bottomSheetHeight, cameraRef])

  const iconSize = 0.17 * (zoomLevel / MAX_MAP_ZOOM)

  // The React Compiler skips this file, so the hex polygons are memoized by hand.
  const hexsFeature = useMemo(
    () =>
      featureCollection(
        Object.keys(hexInfoBuckets).map((h) => {
          const center = parseH3BNLocation(new BN(h))
          return feature(
            {
              type: 'Polygon',
              coordinates: [
                cellToBoundary(
                  latLngToCell(
                    center[0],
                    center[1],
                    networkType === 'MOBILE' ? (zoomLevel > 16 ? 12 : 10) : 8,
                  ),
                ).map((p) => p.reverse()),
              ],
            } as Polygon,
            {
              id: h,
              color: networkType === 'MOBILE' ? mobileHexColor : iotHexColor,
              opacity: h === activeHex ? 1 : 0.3,
            },
          )
        }),
      ),
    [
      activeHex,
      hexInfoBuckets,
      iotHexColor,
      mobileHexColor,
      networkType,
      zoomLevel,
    ],
  )

  const activeHexItem = (() => {
    if (!loadingInfos && activeHex) {
      if (activeHex === DEFAULT_HEX && hotspot) {
        return {
          hotspot,
          info: undefined,
        }
      }

      const info = (hexInfoBuckets[activeHex] || [])[activeHotspotIndex]
      if (info) {
        return {
          hotspot: hotspots.find(
            (h) => h.id === info.asset.toBase58(),
          ) as HotspotWithPendingRewards,
          info,
        }
      }
    }
  })()

  const isLoading = loading || !onEndReached || loadingInfos
  const [debouncedIsLoading] = useDebounce(isLoading, 1000)

  const handleUserLocationPress = () => {
    if (cameraRef?.current && userLocation?.coords) {
      void cameraRef.current.setStop({
        duration: 500,
        easing: 'ease',
        zoom: 14,
        center: [userLocation.coords.longitude, userLocation.coords.latitude],
      })
    }
  }

  const handleRegionChanged = async () => {
    if (mapRef?.current) {
      const zoom = await mapRef.current.getZoom()
      if (zoomLevel !== zoom) {
        setZoomLevel(zoom)
      }
    }
  }

  const handleLegendPress = () => {
    setLegendVisible(true)
  }

  const handleToggleNetwork = () => {
    setNetworkType(networkType === 'IOT' ? 'MOBILE' : 'IOT')
    setHotspot(undefined)
  }

  const handleHexClick: OnPress = (event) => {
    event.stopPropagation()
    const hex = event.nativeEvent.features[0]
    setLegendVisible(false)
    const id = hex.properties?.id
    setActiveHex(id)
    if (id && (hexInfoBuckets[id]?.length || 0) > 1) {
      Alert.alert(
        t('collectablesScreen.hotspots.selectActive.title'),
        t('collectablesScreen.hotspots.selectActive.which'),
        hexInfoBuckets[id].map((info, index) => ({
          text: hotspots.find((h) => h.id === info.asset.toBase58())?.content
            ?.metadata?.name,
          onPress: () => {
            setActiveHotspotIndex(index)
          },
        })),
      )
    }
  }

  return (
    <View className="flex-1">
      <SafeArea edges={BACK_EDGES} className="flex-1">
        <View className="relative grow items-center justify-center overflow-hidden bg-secondary">
          <AnimatedBlurView
            exiting={FADE_OUT_STATE}
            // On android, the blur just doesn't go away when done loading.
            className={`absolute h-full w-full flex-1 ${
              isLoading ? 'z-[100]' : 'z-0'
            } ${debouncedIsLoading ? '' : 'hidden'}`}
            tint="dark"
            intensity={80}
          >
            <View className="h-full flex-1 justify-center">
              <Spinner colorClassName="accent-white" />
            </View>
          </AnimatedBlurView>
          <Map
            map={mapRef}
            camera={cameraRef}
            centerCoordinate={initialCenter}
            mapProps={{
              onRegionDidChange: () => void handleRegionChanged(),
              onPress: () => {
                setActiveHex(undefined)
                setLegendVisible(false)
              },
            }}
          >
            <MapLibreRN.Images
              images={{
                iotHex: require('@assets/images/mapIotHex.png'),
                iotHexActive: require('@assets/images/mapIotHexActive.png'),
                mobileHex: require('@assets/images/mapMobileHex.png'),
                mobileHexActive: require('@assets/images/mapMobileHexActive.png'),
              }}
            />
            <MapLibreRN.GeoJSONSource
              id="hexsFeature"
              data={hexsFeature}
              onPress={handleHexClick}
              hitbox={{
                top: iconSize / 2,
                right: iconSize / 2,
                bottom: iconSize / 2,
                left: iconSize / 2,
              }}
            >
              <MapLibreRN.Layer
                type="fill"
                id="hexs-fill"
                style={{
                  fillColor: ['get', 'color'],
                  fillOpacity: ['get', 'opacity'],
                }}
              />
            </MapLibreRN.GeoJSONSource>
          </Map>
          <View className="absolute top-0 w-full flex-row items-center pl-3 pt-6">
            <PressableScale
              feedback="opacity"
              className="flex-row items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <BackIcon size={24} colorClassName="accent-white" />
              <Text size="base" className="ml-3 font-medium text-white">
                {t('collectablesScreen.hotspots.map.back')}
              </Text>
            </PressableScale>
          </View>
          <View className="absolute bottom-[10px] w-full flex-row items-center justify-between">
            <View className="mx-3">
              <PressableScale
                className={`flex-row items-center justify-center rounded-full py-1.5 pl-2 pr-3 opacity-80 ${
                  networkType === 'IOT' ? 'bg-success-700' : 'bg-blue-dark-700'
                }`}
                onPress={handleToggleNetwork}
              >
                <Hex
                  width={24}
                  height={24}
                  colorClassName={
                    networkType === 'IOT'
                      ? 'accent-success-500'
                      : 'accent-blue-dark-500'
                  }
                />
                <Text className="ml-1.5 text-white">
                  {t('collectablesScreen.hotspots.map.type', {
                    type: networkType,
                  })}
                </Text>
              </PressableScale>
            </View>
            <View className="mx-3 flex-row items-center">
              <Button
                variant="ghost"
                size="icon"
                // TODO: Make this visible when modled coverage is available
                className="mr-3 hidden rounded-full bg-white/30"
                onPress={handleLegendPress}
              >
                <LegendIcon size={18} colorClassName="accent-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/30"
                onPress={handleUserLocationPress}
              >
                <UserLocationIcon
                  size={18}
                  colorClassName="accent-foreground"
                />
              </Button>
            </View>
          </View>
        </View>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetRef}
            snapPoints={[160]}
            enablePanDownToClose
            enableDynamicSizing
            animateOnMount
            index={0}
            backgroundComponent={SheetBackground}
            handleComponent={SheetHandle}
            onDismiss={() => setActiveHex(undefined)}
            onChange={(idx) => setBottomSheetSnapIndex(idx)}
          >
            <BottomSheetScrollView contentInsetAdjustmentBehavior="automatic">
              <View
                onLayout={(e) =>
                  setBottomSheetHeight(e.nativeEvent.layout.height)
                }
              >
                {legendVisible && <HotspotMapLegend network={networkType} />}
                {activeHexItem && activeHexItem.hotspot && (
                  <HotspotMapHotspotDetails
                    hotspot={activeHexItem.hotspot}
                    info={activeHexItem?.info}
                    showActions={bottomSheetSnapIndex === 1}
                    network={networkType}
                  />
                )}
              </View>
            </BottomSheetScrollView>
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </SafeArea>
    </View>
  )
}

export default HotspotMapScreen
