import React, {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
  memo,
} from 'react'
import { BN } from '@coral-xyz/anchor'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Config } from 'react-native-config'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useTranslation } from 'react-i18next'
import InfoIcon from '@assets/images/info.svg'
import SafeAreaBox from '@components/SafeAreaBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import BackScreen from '@components/BackScreen'
import { ReAnimatedBox } from '@components/AnimatedBox'
import MapboxGL from '@rnmapbox/maps'
import { points } from '@turf/helpers'
import turfBbox from '@turf/bbox'
import MapPin from '@assets/images/mapPin.svg'
import FabButton from '@components/FabButton'
import debounce from 'lodash/debounce'
import CircleLoader from '@components/CircleLoader'
import { useReverseGeo } from '@hooks/useReverseGeo'
import { useForwardGeo } from '@hooks/useForwardGeo'
import SearchInput from '@components/SearchInput'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { parseH3BNLocation } from '../../utils/h3'
import { MAX_MAP_ZOOM, MIN_MAP_ZOOM } from '../../utils/mapbox'

MapboxGL.setAccessToken(Config.MAPBOX_ACCESS_TOKEN)

type Route = RouteProp<CollectableStackParamList, 'HotspotAssertLocationScreen'>
const HotspotAssertLocationScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const map = useRef<MapboxGL.MapView>(null)
  const camera = useRef<MapboxGL.Camera>(null)
  const [initialZoomHappend, setInitialZoomHappend] = useState(false)
  const [currentCenter, setCurrentCenter] = useState<number[] | undefined>()
  const reverseGeo = useReverseGeo(currentCenter)
  const forwardGeo = useForwardGeo()
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [userLocation, setUserLocation] = useState<
    MapboxGL.Location | undefined
  >()

  const { collectable } = route.params
  const {
    content: { metadata },
    /*     iotInfo,
    mobileInfo, */
  } = collectable

  const fakeLocation = '631210968850212863'
  const iotLocation = parseH3BNLocation(new BN(fakeLocation))
  const mobileLocation = parseH3BNLocation(new BN(fakeLocation))
  const sameLocation =
    JSON.stringify(iotLocation) === JSON.stringify(mobileLocation)

  /*   const iotLocation = useMemo(() => {
    if (!iotInfo?.location) {
      return undefined
    }

    return cellToLatLng(iotInfo.location.toString('hex'))
  }, [iotInfo])

  const mobileLocation = useMemo(() => {
    if (!mobileInfo?.location) {
      return undefined
    }

    return cellToLatLng(mobileInfo.location.toString('hex'))
  }, [mobileInfo]) */

  useEffect(() => {
    if (camera.current && !initialZoomHappend) {
      const coords = [
        userLocation?.coords
          ? [userLocation?.coords.latitude, userLocation?.coords.longitude]
          : [37.773972, -122.431297],
        iotLocation,
        mobileLocation,
      ].filter(Boolean) as number[][]

      try {
        const bbox = turfBbox(points(coords))
        camera.current.setCamera({
          bounds: {
            ne: [bbox[3], bbox[2]],
            sw: [bbox[1], bbox[0]],
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 20,
            paddingBottom: 20,
          },
        })
        setInitialZoomHappend(true)
      } catch (error) {
        console.error(error)
      }
    }
  }, [
    camera,
    initialZoomHappend,
    setInitialZoomHappend,
    iotLocation,
    mobileLocation,
    userLocation?.coords,
  ])

  const handleInfoPress = useCallback(() => {
    if (collectable.content?.metadata) {
      navigation.push('NftMetadataScreen', {
        metadata: collectable.content.metadata,
      })
    }
  }, [collectable.content.metadata, navigation])

  const handleSearchPress = useCallback(() => {
    setSearchVisible(!searchVisible)
  }, [searchVisible, setSearchVisible])

  const hideSearch = useCallback(() => {
    setSearchValue('')
    setSearchVisible(false)
  }, [setSearchValue, setSearchVisible])

  const handleSearchEnter = useCallback(async () => {
    const coords = await forwardGeo.execute(searchValue)
    hideSearch()
    if (camera.current && coords) {
      camera.current.moveTo(coords)
    }
  }, [camera, hideSearch, searchValue, forwardGeo])

  const handleCameraChanged = debounce(async (state: MapboxGL.MapState) => {
    const { center } = state.properties
    if (JSON.stringify(center) !== JSON.stringify(currentCenter)) {
      setCurrentCenter(center)
      hideSearch()
    }
  }, 500)

  const handleUserLocationPress = useCallback(() => {
    if (camera.current && userLocation?.coords) {
      camera.current.moveTo([
        userLocation.coords.longitude,
        userLocation.coords.latitude,
      ])
    }
  }, [userLocation, camera])

  const handleAssertLocationPress = useCallback(async () => {
    if (map.current) {
      /* TODO: Assert the location */
      /* console.log(await map.current.getCenter()) */
    }
  }, [map])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <BackScreen
        headerTopMargin="l"
        padding="none"
        title={t('collectablesScreen.hotspots.assertLocation')}
        backgroundImageUri={collectable.content?.metadata?.image || ''}
        edges={backEdges}
        TrailingIcon={InfoIcon}
        onTrailingIconPress={handleInfoPress}
      >
        <SafeAreaBox
          edges={safeEdges}
          backgroundColor="transparent"
          flex={1}
          padding="m"
          marginHorizontal="s"
          marginVertical="xs"
        >
          <Box
            flexDirection="row"
            alignItems="center"
            backgroundColor="surfaceSecondary"
            borderTopLeftRadius="l"
            borderTopRightRadius="l"
          >
            <ImageBox
              borderRadius="lm"
              height={60}
              width={60}
              source={{
                uri: metadata?.image,
                cache: 'force-cache',
              }}
            />
            <Box marginStart="s" flex={1}>
              {metadata?.name && (
                <Text textAlign="left" variant="subtitle2" adjustsFontSizeToFit>
                  {removeDashAndCapitalize(metadata.name)}
                </Text>
              )}
              <Box flexDirection="row">
                <Box flexDirection="row" alignItems="center" marginRight="m">
                  <Text
                    variant="subtitle4"
                    color="secondaryText"
                    marginRight="s"
                  >
                    IOT:
                  </Text>
                  <Box
                    backgroundColor={
                      iotLocation ? 'greenBright500' : 'darkGrey'
                    }
                    width={12}
                    height={12}
                    borderRadius="round"
                  />
                </Box>
                <Box flexDirection="row" alignItems="center" marginRight="m">
                  <Text
                    variant="subtitle4"
                    color="secondaryText"
                    marginRight="s"
                  >
                    MOBILE:
                  </Text>
                  <Box
                    backgroundColor={
                      mobileLocation ? 'blueBright500' : 'darkGrey'
                    }
                    width={12}
                    height={12}
                    borderRadius="round"
                  />
                </Box>
              </Box>
            </Box>
          </Box>
          <Box
            flexGrow={1}
            justifyContent="center"
            alignItems="center"
            borderBottomLeftRadius="l"
            borderBottomRightRadius="l"
            backgroundColor="white"
            overflow="hidden"
            position="relative"
          >
            <MapboxGL.MapView
              ref={map}
              styleURL={MapboxGL.StyleURL.Dark}
              style={{ flex: 1, width: '100%' }}
              logoEnabled={false}
              scaleBarEnabled={false}
              attributionEnabled={false}
              onCameraChanged={handleCameraChanged}
              onPress={() => hideSearch()}
            >
              <MapboxGL.Camera
                ref={camera}
                minZoomLevel={MIN_MAP_ZOOM}
                maxZoomLevel={MAX_MAP_ZOOM}
                defaultSettings={{
                  zoomLevel: MAX_MAP_ZOOM,
                  centerCoordinate: [
                    userLocation?.coords?.longitude ||
                      iotLocation[1] ||
                      mobileLocation[1] ||
                      37.773972,
                    userLocation?.coords?.latitude ||
                      iotLocation[0] ||
                      mobileLocation[0] ||
                      -122.431297,
                  ],
                }}
              />
              <MapboxGL.UserLocation visible onUpdate={setUserLocation} />
              {/* TODO remove that 0.001 logic */}
              {(sameLocation
                ? [iotLocation]
                : [iotLocation, mobileLocation]
              ).map((location, i) => (
                <MapboxGL.MarkerView
                  key={`MarkerView-${i + 1}`}
                  coordinate={[
                    i === 0 ? location[1] + 0.001 : location[1],
                    location[0],
                  ]}
                  allowOverlap
                >
                  {sameLocation ? (
                    <Box flexDirection="row">
                      <Box
                        width={0}
                        height={0}
                        borderWidth={6.5}
                        borderStyle="solid"
                        borderRadius="round"
                        borderTopColor="greenBright500"
                        borderBottomColor="blueBright500"
                        borderRightColor="greenBright500"
                        borderLeftColor="blueBright500"
                      />
                    </Box>
                  ) : (
                    <Box
                      backgroundColor={
                        i === 0 ? 'greenBright500' : 'blueBright500'
                      }
                      width={12}
                      height={12}
                      borderRadius="round"
                    />
                  )}
                </MapboxGL.MarkerView>
              ))}
            </MapboxGL.MapView>

            <Box
              flexDirection="column"
              justifyContent="center"
              position="absolute"
              bottom="50%"
            >
              <MapPin width={30} height={30} />
            </Box>

            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              position="absolute"
              top={searchVisible ? 0 : 8}
              right={searchVisible ? 0 : 8}
            >
              {!searchVisible ? (
                <FabButton
                  icon="search"
                  backgroundColor="white"
                  backgroundColorOpacity={0}
                  backgroundColorOpacityPressed={0}
                  width={40}
                  height={40}
                  justifyContent="center"
                  onPress={handleSearchPress}
                />
              ) : (
                <SearchInput
                  placeholder="Search Location"
                  onChangeText={setSearchValue}
                  onEnter={handleSearchEnter}
                  value={searchValue}
                  width="100%"
                  borderRadius="none"
                  autoFocus
                />
              )}
            </Box>

            {userLocation?.coords && (
              <Box
                flexDirection="row"
                justifyContent="center"
                alignItems="center"
                position="absolute"
                bottom={8}
                left={8}
              >
                <FabButton
                  icon="mapUserLocation"
                  backgroundColor="white"
                  backgroundColorOpacity={0.3}
                  backgroundColorOpacityPressed={0.5}
                  width={40}
                  height={40}
                  justifyContent="center"
                  onPress={handleUserLocationPress}
                />
              </Box>
            )}
          </Box>
          <Box
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
            marginVertical="s"
            minHeight={40}
          >
            {reverseGeo.loading ? (
              <CircleLoader loaderSize={20} color="white" />
            ) : (
              <Text variant="subtitle4" color="grey600" marginRight="s">
                {reverseGeo.result}
              </Text>
            )}
          </Box>
          <Box>
            <ButtonPressable
              height={65}
              flexGrow={1}
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="white"
              backgroundColorDisabledOpacity={0.1}
              titleColorDisabled="grey600"
              title={t('collectablesScreen.hotspots.assertLocation')}
              titleColor="black"
              disabled={!currentCenter}
              onPress={
                reverseGeo.loading || forwardGeo.loading
                  ? null
                  : handleAssertLocationPress
              }
            />
          </Box>
        </SafeAreaBox>
      </BackScreen>
    </ReAnimatedBox>
  )
}

export default memo(HotspotAssertLocationScreen)
