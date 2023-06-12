import MapPin from '@assets/images/mapPin.svg'
import { ReAnimatedBlurBox, ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import FabButton from '@components/FabButton'
import { DelayedFadeIn, FadeInFast } from '@components/FadeInOut'
import ImageBox from '@components/ImageBox'
import SafeAreaBox from '@components/SafeAreaBox'
import SearchInput from '@components/SearchInput'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import { HotspotType } from '@helium/onboarding'
import useAlert from '@hooks/useAlert'
import { useForwardGeo } from '@hooks/useForwardGeo'
import { useReverseGeo } from '@hooks/useReverseGeo'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { RouteProp, useRoute } from '@react-navigation/native'
import MapboxGL from '@rnmapbox/maps'
import turfBbox from '@turf/bbox'
import { points } from '@turf/helpers'
import debounce from 'lodash/debounce'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, KeyboardAvoidingView } from 'react-native'
import { Config } from 'react-native-config'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useEntityKey } from '@hooks/useEntityKey'
import { useIotInfo } from '@hooks/useIotInfo'
import { useMobileInfo } from '@hooks/useMobileInfo'
import { parseH3BNLocation } from '../../utils/h3'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import * as Logger from '../../utils/logger'
import { MAX_MAP_ZOOM, MIN_MAP_ZOOM } from '../../utils/mapbox'
import { CollectableStackParamList } from './collectablesTypes'

const BUTTON_HEIGHT = 65
type Route = RouteProp<CollectableStackParamList, 'AssertLocationScreen'>
const AssertLocationScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { collectable } = route.params
  const entityKey = useEntityKey(collectable)
  const iotInfoAcc = useIotInfo(entityKey)
  const mobileInfoAcc = useMobileInfo(entityKey)
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const camera = useRef<MapboxGL.Camera>(null)
  const userLocation = useRef<MapboxGL.UserLocation>(null)
  const { showOKAlert } = useAlert()
  const [mapCenter, setMapCenter] = useState<number[]>()
  const [initialZoomHappend, setInitialZoomHappend] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchValue, setSearchValue] = useState<string>()
  const [elevGainVisible, setElevGainVisible] = useState(false)
  const [gain, setGain] = useState<string>()
  const [elevation, setElevation] = useState<string>()
  const [asserting, setAsserting] = useState(false)
  const [transactionError, setTransactionError] = useState<string>()
  const reverseGeo = useReverseGeo(mapCenter)
  const forwardGeo = useForwardGeo()
  const { submitUpdateEntityInfo } = useSubmitTxn()

  const {
    content: { metadata },
  } = collectable

  const iotLocation = useMemo(() => {
    if (!iotInfoAcc?.info?.location) {
      return undefined
    }

    return parseH3BNLocation(iotInfoAcc.info.location).reverse()
  }, [iotInfoAcc])

  const mobileLocation = useMemo(() => {
    if (!mobileInfoAcc?.info?.location) {
      return undefined
    }

    return parseH3BNLocation(mobileInfoAcc.info.location).reverse()
  }, [mobileInfoAcc])

  const sameLocation = useMemo(() => {
    if (!iotLocation || !mobileLocation) {
      return false
    }

    return JSON.stringify(iotLocation) === JSON.stringify(mobileLocation)
  }, [iotLocation, mobileLocation])

  const initialCenter = useMemo(() => {
    return (
      userLocation?.current?.state.coordinates ||
      iotLocation ||
      mobileLocation || [-122.419418, 37.774929]
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.current, iotLocation, mobileLocation])

  useEffect(() => {
    if (camera?.current && !initialZoomHappend) {
      setInitialZoomHappend(true)
      const coords = [initialCenter, iotLocation, mobileLocation].filter(
        Boolean,
      ) as number[][]

      try {
        const bbox = turfBbox(points(coords))
        camera.current.setCamera({
          animationDuration: 500,
          bounds: {
            ne: [bbox[0], bbox[1]],
            sw: [bbox[2], bbox[3]],
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 20,
            paddingBottom: 20,
          },
        })
      } catch (error) {
        console.error(error)
      }
    }
  }, [
    camera,
    iotLocation,
    initialCenter,
    mobileLocation,
    initialZoomHappend,
    setInitialZoomHappend,
  ])

  useEffect(() => {
    if (iotInfoAcc?.info?.gain) {
      setGain(`${iotInfoAcc?.info?.gain / 10}`)
    }

    if (iotInfoAcc?.info?.elevation) {
      setElevation(`${iotInfoAcc?.info?.elevation}`)
    }
  }, [iotInfoAcc, setGain, setElevation])

  const resetGain = useCallback(
    () =>
      setGain(
        iotInfoAcc?.info?.gain ? `${iotInfoAcc.info.gain / 10}` : undefined,
      ),
    [iotInfoAcc, setGain],
  )

  const resetElevation = useCallback(
    () =>
      setElevation(
        iotInfoAcc?.info?.elevation
          ? `${iotInfoAcc.info.elevation}`
          : undefined,
      ),
    [iotInfoAcc, setElevation],
  )

  const handleSearchPress = useCallback(() => {
    setSearchVisible(!searchVisible)
  }, [searchVisible, setSearchVisible])

  const hideSearch = useCallback(() => {
    setSearchValue(undefined)
    setSearchVisible(false)
  }, [setSearchValue, setSearchVisible])

  const hideElevGain = useCallback(() => {
    setElevGainVisible(false)
    resetGain()
    resetElevation()
  }, [setElevGainVisible, resetGain, resetElevation])

  const handleOnSearch = useCallback(async () => {
    if (searchValue) {
      try {
        const coords = await forwardGeo.execute(searchValue)

        if (camera?.current && coords) {
          camera.current.setCamera({
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

    hideSearch()
  }, [camera, t, hideSearch, searchValue, forwardGeo, showOKAlert])

  const onCameraChanged = debounce(async (state: MapboxGL.MapState) => {
    const { center } = state.properties
    if (JSON.stringify(center) !== JSON.stringify(mapCenter)) {
      setMapCenter(center)
      setTransactionError(undefined)
      hideSearch()
    }
  }, 600)

  const handleUserLocationPress = useCallback(() => {
    if (camera?.current && userLocation?.current?.state.coordinates) {
      camera.current.setCamera({
        animationDuration: 500,
        zoomLevel: MAX_MAP_ZOOM,
        centerCoordinate: userLocation.current.state.coordinates,
      })
    }
  }, [userLocation, camera])

  const assertLocation = useCallback(
    async (type: HotspotType) => {
      if (mapCenter && entityKey) {
        setTransactionError(undefined)
        setAsserting(true)
        try {
          hideElevGain()
          await submitUpdateEntityInfo({
            type,
            entityKey,
            lng: mapCenter[0],
            lat: mapCenter[1],
            elevation,
            decimalGain: gain,
          })
          setAsserting(false)
        } catch (error) {
          setAsserting(false)
          Logger.error(error)
          setTransactionError((error as Error).message)
        }
      }
    },
    [
      entityKey,
      mapCenter,
      elevation,
      gain,
      hideElevGain,
      setAsserting,
      setTransactionError,
      submitUpdateEntityInfo,
      // nav,
    ],
  )

  const handleAssertLocationPress = useCallback(async () => {
    if (!elevGainVisible) {
      Alert.alert(
        t('assertLocationScreen.title'),
        t('assertLocationScreen.whichLocation'),
        [
          {
            text: 'Iot',
            onPress: () => setElevGainVisible(true),
          },
          {
            text: 'Mobile',
            onPress: async () => assertLocation('mobile'),
          },
          {
            text: t('generic.cancel'),
            style: 'destructive',
          },
        ],
      )
    } else {
      // elevGainVisible
      // we can assume user is asserting location from elevGain UI
      await assertLocation('iot')
    }
  }, [t, elevGainVisible, assertLocation])

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <BackScreen
        headerTopMargin="l"
        padding="none"
        title={t('assertLocationScreen.title')}
        backgroundImageUri={collectable.content?.metadata?.image || ''}
        edges={backEdges}
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
            borderRadius="l"
            marginBottom="s"
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
            borderRadius="l"
            backgroundColor="white"
            overflow="hidden"
            position="relative"
          >
            <MapboxGL.MapView
              styleURL={Config.MAPBOX_STYLE_URL || MapboxGL.StyleURL.Dark}
              style={{ flex: 1, width: '100%' }}
              logoEnabled={false}
              scaleBarEnabled={false}
              attributionEnabled={false}
              zoomEnabled={!asserting}
              scrollEnabled={!asserting}
              pitchEnabled={false}
              rotateEnabled={false}
              onCameraChanged={onCameraChanged}
              onPress={() => hideSearch()}
            >
              <MapboxGL.Camera
                ref={camera}
                minZoomLevel={MIN_MAP_ZOOM}
                maxZoomLevel={MAX_MAP_ZOOM}
                defaultSettings={{
                  zoomLevel: MAX_MAP_ZOOM,
                  centerCoordinate: initialCenter,
                }}
              />
              <MapboxGL.UserLocation visible ref={userLocation} />
              {(sameLocation ? [iotLocation] : [iotLocation, mobileLocation])
                .map((location, i) => {
                  if (!location || location.length < 2) return null

                  return (
                    <MapboxGL.MarkerView
                      key={`MarkerView-${i + 1}`}
                      coordinate={[
                        i === 0 ? location[0] + 0.001 : location[0],
                        location[1],
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
                  )
                })
                .filter(Boolean)}
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
                  backgroundColorOpacity={0.1}
                  backgroundColorOpacityPressed={0.5}
                  width={40}
                  height={40}
                  justifyContent="center"
                  onPress={handleSearchPress}
                />
              ) : (
                <SearchInput
                  placeholder={t('assertLocationScreen.searchLocation')}
                  onChangeText={setSearchValue}
                  onEnter={handleOnSearch}
                  value={searchValue}
                  width="100%"
                  borderRadius="none"
                  autoFocus
                />
              )}
            </Box>

            {userLocation?.current && (
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
            {reverseGeo.loading && (
              <CircleLoader loaderSize={20} color="white" />
            )}
            {showError && (
              <Text variant="body3Medium" color="red500">
                {showError}
              </Text>
            )}
            {!reverseGeo.loading && !showError && (
              <Text variant="body3Medium" color="grey600">
                {reverseGeo.result}
              </Text>
            )}
          </Box>
          <Box>
            <ButtonPressable
              height={BUTTON_HEIGHT}
              flexGrow={1}
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="white"
              backgroundColorDisabledOpacity={0.0}
              titleColorDisabled="grey600"
              title={asserting ? '' : t('assertLocationScreen.title')}
              titleColor="black"
              disabled={!mapCenter || reverseGeo.loading || asserting}
              onPress={
                reverseGeo.loading || forwardGeo.loading
                  ? undefined
                  : handleAssertLocationPress
              }
              TrailingComponent={
                asserting ? (
                  <CircleLoader loaderSize={20} color="white" />
                ) : undefined
              }
            />
          </Box>
        </SafeAreaBox>
      </BackScreen>
      {elevGainVisible ? (
        <ReAnimatedBlurBox
          visible={elevGainVisible}
          entering={FadeInFast}
          flexDirection="row"
          position="absolute"
          height="100%"
          width="100%"
        >
          <BackScreen
            headerTopMargin="l"
            padding="none"
            hideBack
            edges={backEdges}
            onClose={hideElevGain}
          >
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
              <SafeAreaBox
                edges={safeEdges}
                backgroundColor="transparent"
                flex={1}
                padding="m"
                marginHorizontal="s"
                marginVertical="xs"
              >
                <Box flexGrow={1} justifyContent="center">
                  <Text
                    textAlign="left"
                    variant="subtitle2"
                    adjustsFontSizeToFit
                  >
                    {t('assertLocationScreen.antennaSetup')}
                  </Text>
                  <Text
                    variant="subtitle4"
                    color="secondaryText"
                    marginBottom="m"
                  >
                    {t('assertLocationScreen.antennaSetupDescription')}
                  </Text>
                  <Box
                    width="100%"
                    backgroundColor="secondary"
                    borderRadius="l"
                    paddingVertical="xs"
                  >
                    <TextInput
                      variant="transparent"
                      textInputProps={{
                        placeholder: t('assertLocationScreen.gainPlaceholder'),
                        onChangeText: (val) => setGain(val),
                        multiline: true,
                        value: gain,
                        returnKeyType: 'next',
                        keyboardType: 'decimal-pad',
                      }}
                    />
                    <Box height={1} width="100%" backgroundColor="black200" />
                    <TextInput
                      variant="transparent"
                      textInputProps={{
                        placeholder: t(
                          'assertLocationScreen.elevationPlaceholder',
                        ),
                        onChangeText: (val) => setElevation(val),
                        value: elevation,
                        keyboardType: 'decimal-pad',
                      }}
                    />
                  </Box>
                </Box>
                <Box>
                  <ButtonPressable
                    height={BUTTON_HEIGHT}
                    flexGrow={1}
                    borderRadius="round"
                    backgroundColor="white"
                    backgroundColorOpacityPressed={0.7}
                    backgroundColorDisabled="white"
                    backgroundColorDisabledOpacity={0.0}
                    titleColorDisabled="grey600"
                    title={asserting ? '' : t('assertLocationScreen.title')}
                    titleColor="black"
                    onPress={handleAssertLocationPress}
                  />
                </Box>
              </SafeAreaBox>
            </KeyboardAvoidingView>
          </BackScreen>
        </ReAnimatedBlurBox>
      ) : undefined}
    </ReAnimatedBox>
  )
}

export default memo(AssertLocationScreen)
