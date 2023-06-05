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
import { DelayedFadeIn, FadeInFast } from '@components/FadeInOut'
import Box from '@components/Box'
import ImageBox from '@components/ImageBox'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import BackScreen from '@components/BackScreen'
import { ReAnimatedBox, ReAnimatedBlurBox } from '@components/AnimatedBox'
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
  Alert,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInput as RNTextInput,
} from 'react-native'
import useAlert from '@hooks/useAlert'
import TextInput from '@components/TextInput'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { HotspotType } from '@helium/onboarding'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { removeDashAndCapitalize } from '../../utils/hotspotNftsUtils'
import { parseH3BNLocation, getH3Location } from '../../utils/h3'
import { MAX_MAP_ZOOM, MIN_MAP_ZOOM } from '../../utils/mapbox'
import * as Logger from '../../utils/logger'

MapboxGL.setAccessToken(Config.MAPBOX_ACCESS_TOKEN)

const BUTTON_HEIGHT = 65
type Route = RouteProp<CollectableStackParamList, 'HotspotAssertLocationScreen'>
const HotspotAssertLocationScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const navigation = useNavigation<CollectableNavigationProp>()
  const map = useRef<MapboxGL.MapView>(null)
  const camera = useRef<MapboxGL.Camera>(null)
  const elevationInput = useRef<RNTextInput>(null)
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const [initialZoomHappend, setInitialZoomHappend] = useState(false)
  const [currentCenter, setCurrentCenter] = useState<number[] | undefined>()
  const reverseGeo = useReverseGeo(currentCenter)
  const forwardGeo = useForwardGeo()
  const { showOKAlert } = useAlert()
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchValue, setSearchValue] = useState<string | undefined>()
  const [elevGainVisible, setElevGainVisible] = useState(false)
  const [gain, setGain] = useState<number | undefined>()
  const [elevation, setElevation] = useState<number | undefined>()
  const [asserting, setAsserting] = useState(false)
  const [transactionError, setTransactionError] = useState<undefined | string>()
  const [userLocation, setUserLocation] = useState<
    MapboxGL.Location | undefined
  >()
  const { submitUpdateHotspotInfo } = useSubmitTxn()

  const { collectable } = route.params
  const {
    content: { metadata },
    iotInfo,
    mobileInfo,
  } = collectable

  const iotLocation = useMemo(() => {
    if (!iotInfo?.location) {
      return []
    }

    return parseH3BNLocation(iotInfo.location)
  }, [iotInfo])

  const mobileLocation = useMemo(() => {
    if (!mobileInfo?.location) {
      return []
    }

    return parseH3BNLocation(mobileInfo.location)
  }, [mobileInfo])

  const sameLocation =
    JSON.stringify(iotLocation) === JSON.stringify(mobileLocation)

  useEffect(() => {
    if (iotInfo?.gain) {
      setGain(iotInfo.gain)
    }

    if (iotInfo?.elevation) {
      setElevation(iotInfo.elevation)
    }
  }, [iotInfo, setElevation, setGain])

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
    setSearchValue(undefined)
    setSearchVisible(false)
  }, [setSearchValue, setSearchVisible])

  const hideElevGain = useCallback(() => {
    setElevGainVisible(false)
    setGain(undefined)
    setElevation(undefined)
  }, [setGain, setElevation, setElevGainVisible])

  const handleSearchEnter = useCallback(async () => {
    if (searchValue) {
      try {
        const coords = await forwardGeo.execute(searchValue)

        if (camera.current && coords) {
          camera.current.moveTo(coords)
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

  const handleCameraChanged = debounce(async (state: MapboxGL.MapState) => {
    const { center } = state.properties
    if (JSON.stringify(center) !== JSON.stringify(currentCenter)) {
      setCurrentCenter(center)
      setTransactionError(undefined)
      hideSearch()
    }
  }, 700)

  const handleUserLocationPress = useCallback(() => {
    if (camera.current && userLocation?.coords) {
      camera.current.moveTo([
        userLocation.coords.longitude,
        userLocation.coords.latitude,
      ])
    }
  }, [userLocation, camera])

  const handleFocusElevation = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (e.nativeEvent.key === 'Enter') {
        elevationInput.current?.focus()
      }
    },
    [],
  )

  const handleAssertLocation = useCallback(
    async (type: HotspotType) => {
      if (currentCenter) {
        setAsserting(true)
        try {
          hideElevGain()
          await submitUpdateHotspotInfo({
            type,
            hotspot: collectable,
            location: new BN(
              getH3Location(currentCenter[1], currentCenter[0]),
              'hex',
            ).toString(),
            elevation,
            gain,
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
      collectable,
      currentCenter,
      elevation,
      gain,
      hideElevGain,
      setAsserting,
      setTransactionError,
      submitUpdateHotspotInfo,
    ],
  )

  const handleAssertLocationPress = useCallback(async () => {
    if (map.current) {
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
              onPress: async () => handleAssertLocation('mobile'),
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
        await handleAssertLocation('iot')
      }
    }
  }, [map, t, elevGainVisible, handleAssertLocation])

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
              {(sameLocation ? [iotLocation] : [iotLocation, mobileLocation])
                .map((location, i) => {
                  if (location.length < 2) return null

                  return (
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
              backgroundColorDisabledOpacity={0.1}
              titleColorDisabled="grey600"
              title={t('assertLocationScreen.title')}
              titleColor="black"
              disabled={!currentCenter || reverseGeo.loading || asserting}
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
                        onChangeText: (val) =>
                          setGain(+val.replace(/[^0-9]/g, '')),
                        multiline: true,
                        value: gain ? `${gain}` : '',
                        returnKeyType: 'next',
                        autoComplete: 'off',
                        autoCorrect: false,
                        onKeyPress: handleFocusElevation,
                      }}
                    />
                    <Box height={1} width="100%" backgroundColor="black200" />
                    <TextInput
                      variant="transparent"
                      textInputProps={{
                        placeholder: t(
                          'assertLocationScreen.elevationPlaceholder',
                        ),
                        onChangeText: (val) =>
                          setElevation(+val.replace(/[^0-9]/g, '')),
                        value: elevation ? `${elevation}` : '',
                        returnKeyType: 'done',
                        autoComplete: 'off',
                        autoCorrect: false,
                      }}
                      ref={elevationInput}
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
                    backgroundColorDisabledOpacity={0.1}
                    titleColorDisabled="grey600"
                    title={t('assertLocationScreen.title')}
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

export default memo(HotspotAssertLocationScreen)