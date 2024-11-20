import MapPin from '@assets/images/mapPin.svg'
import { Box, DelayedFadeIn, FadeInOut, ReAnimatedBox, Text } from '@components'
import useAlert from '@hooks/useAlert'
import { useForwardGeo } from '@hooks/useForwardGeo'
import { useReverseGeo } from '@hooks/useReverseGeo'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView } from 'react-native'
import 'text-encoding-polyfill'
import { useDebounce } from 'use-debounce'
import { useColors, useSpacing } from '@theme/themeHooks'
import Map from '@components/Map'
import {
  Camera,
  Location,
  MapState,
  MapView,
  UserLocation,
} from '@rnmapbox/maps'
import { INITIAL_MAP_VIEW_STATE, MAX_MAP_ZOOM } from '@utils/mapUtils'
import { Search } from '@components/Search'
import CheckButton from '../components/CheckButton'
import { useHotspotOnboarding } from '../index'

const SelectLocationScreen = () => {
  const { t } = useTranslation()
  const mapRef = useRef<MapView>(null)
  const cameraRef = useRef<Camera>(null)
  const { showOKAlert } = useAlert()
  const colors = useColors()
  const spacing = useSpacing()
  const { carouselRef, setOnboardDetails } = useHotspotOnboarding()
  const [mapCenter, setMapCenter] = useState<number[]>()
  const [searchValue, setSearchValue] = useState<string>()
  const reverseGeo = useReverseGeo(mapCenter)
  const forwardGeo = useForwardGeo()
  const [darkCheckMode, setDarkCheckMode] = useState(true)

  const [initialUserLocation, setInitialUserLocation] = useState<number[]>()
  const [initialCenterSet, setInitalCenter] = useState(false)

  const [userLocation, setUserLocation] = useState<Location>()
  const onUserLocationUpdate = useCallback(
    (loc: Location) => {
      setUserLocation(loc)
    },
    [setUserLocation],
  )

  const handleCameraChanged = useCallback((state: MapState) => {
    setDarkCheckMode(state.properties.zoom < 3)
  }, [])

  useEffect(() => {
    const coords = userLocation?.coords
    if (!initialUserLocation && coords) {
      setInitialUserLocation([coords.longitude, coords.latitude])
    }
  }, [initialUserLocation, setInitialUserLocation, userLocation?.coords])

  const initialCenter = useMemo(() => {
    return initialUserLocation || INITIAL_MAP_VIEW_STATE.centerCoordinate
  }, [initialUserLocation])

  useEffect(() => {
    if (
      initialCenter &&
      JSON.stringify(initialCenter) !==
        JSON.stringify(INITIAL_MAP_VIEW_STATE.centerCoordinate) &&
      !initialCenterSet
    ) {
      setInitalCenter(true)
      cameraRef.current?.setCamera({
        centerCoordinate: initialCenter,
        animationDuration: 0,
      })
    }
  }, [initialCenter, cameraRef, initialCenterSet, setInitalCenter])

  const handleOnSearch = useCallback(async () => {
    if (searchValue) {
      try {
        const coords = await forwardGeo.execute(searchValue)

        if (cameraRef?.current && coords) {
          cameraRef.current.setCamera({
            animationDuration: 500,
            centerCoordinate: coords,
            zoomLevel: MAX_MAP_ZOOM / 1.2,
          })
        }
      } catch (error) {
        const { message = '' } = error as Error
        if (message === t('noData')) {
          await showOKAlert({
            title: t('generic.error'),
            message: t('assertLocationScreen.locationNotFound'),
          })
        }
      }
    }
  }, [cameraRef, t, searchValue, forwardGeo, showOKAlert])

  const handleRegionChanged = useCallback(async () => {
    if (mapRef?.current) {
      const center = await mapRef?.current.getCenter()
      if (JSON.stringify(center) !== JSON.stringify(mapCenter)) {
        setMapCenter(center)
      }
    }
  }, [mapRef, mapCenter, setMapCenter])

  const onConfirmLocation = useCallback(() => {
    const long = mapCenter?.[0]
    const lat = mapCenter?.[1]

    setOnboardDetails((o) => ({
      ...o,
      latitude: lat || 0,
      longitude: long || 0,
    }))
    carouselRef?.current?.snapToNext()
  }, [mapCenter, carouselRef, setOnboardDetails])

  const [reverseGeoLoading] = useDebounce(reverseGeo.loading, 300)

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <Box
        flexGrow={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor="primaryBackground"
        overflow="hidden"
        position="relative"
        borderTopLeftRadius="6xl"
        borderTopRightRadius="6xl"
      >
        <Map
          ref={mapRef}
          onUserLocationUpdate={onUserLocationUpdate}
          onCameraChanged={handleCameraChanged}
          onRegionDidChange={handleRegionChanged}
          style={{
            flex: 1,
            width: '100%',
          }}
        >
          <>
            <Camera
              ref={cameraRef}
              defaultSettings={{
                ...INITIAL_MAP_VIEW_STATE,
                centerCoordinate:
                  initialCenter || INITIAL_MAP_VIEW_STATE.centerCoordinate,
                zoomLevel: 1,
              }}
              minZoomLevel={0}
              maxZoomLevel={MAX_MAP_ZOOM}
            />
            <UserLocation />
            {/* {(sameLocation ? [iotLocation] : [iotLocation, mobileLocation])
                .map((location, i) => {
                  if (!location || location.length < 2) return null

                  return (
                    <MarkerView
                      id={`MarkerView-${i + 1}`}
                      coordinate={[
                        i === 0 ? location[0] + 0.001 : location[0],
                        location[1],
                      ]}
                    >
                      {sameLocation ? (
                        <Box flexDirection="row">
                          <Box
                            position="relative"
                            height={16}
                            width={8}
                            overflow="hidden"
                          >
                            <Box position="absolute" left={0}>
                              <Hex
                                width={16}
                                height={16}
                                color={colors['green.light-500']}
                              />
                            </Box>
                          </Box>
                          <Box
                            position="relative"
                            height={16}
                            width={8}
                            overflow="hidden"
                          >
                            <Box position="absolute" left={-8}>
                              <Hex
                                width={16}
                                height={16}
                                color={colors['blue.dark-500']}
                              />
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <Hex
                          width={16}
                          height={16}
                          color={
                            i === 0
                              ? colors['green.light-500']
                              : colors['blue.light-500']
                          }
                        />
                      )}
                    </MarkerView>
                  )
                })
                .filter(Boolean)} */}
          </>
        </Map>
        <Box
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          gap="2"
          position="absolute"
          bottom="50%"
        >
          <MapPin width={30} height={30} color={colors['base.black']} />
        </Box>

        <Box position="absolute" top={0} left={0} right={0}>
          <KeyboardAvoidingView style={{ flex: 1 }}>
            <Box flexDirection="row" padding="xl">
              <Search
                placeholder={t('assertLocationScreen.searchLocation')}
                onChangeText={setSearchValue}
                onEnter={handleOnSearch}
                width="100%"
                borderRadius="full"
                marginTop="2xl"
              />
            </Box>
          </KeyboardAvoidingView>
        </Box>
        <Box
          position="absolute"
          bottom={spacing['10xl']}
          left={0}
          right={0}
          alignItems="center"
        >
          {!reverseGeoLoading && reverseGeo.result && (
            <FadeInOut>
              <Box
                flexShrink={1}
                backgroundColor="primaryBackground"
                flexDirection="row"
                alignItems="center"
                paddingHorizontal="3"
                paddingVertical="1.5"
                borderRadius="full"
                minHeight={36}
                shadowColor="base.black"
                shadowOffset={{ width: 0, height: 1 }}
                shadowOpacity={0.2}
                shadowRadius={2}
              >
                <Text
                  variant="textMdSemibold"
                  color="primaryText"
                  numberOfLines={1}
                >
                  {reverseGeo.result}
                </Text>
              </Box>
            </FadeInOut>
          )}
        </Box>
      </Box>
      <CheckButton onPress={onConfirmLocation} isDark={darkCheckMode} />
    </ReAnimatedBox>
  )
}

export default SelectLocationScreen
