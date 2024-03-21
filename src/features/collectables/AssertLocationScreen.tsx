/* import MapPin from '@assets/images/mapPin.svg'
import {
  BackScreen,
  Box,
  ButtonPressable,
  CircleLoader,
  DelayedFadeIn,
  FabButton,
  FadeInFast,
  FadeInOut,
  ImageBox,
  ReAnimatedBlurBox,
  ReAnimatedBox,
  SafeAreaBox,
  SearchInput,
  Text,
  TextInput,
} from '@components'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { NetworkType } from '@helium/onboarding'
import { IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import useAlert from '@hooks/useAlert'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useEntityKey } from '@hooks/useEntityKey'
import { useForwardGeo } from '@hooks/useForwardGeo'
import { useImplicitBurn } from '@hooks/useImplicitBurn'
import { useIotInfo } from '@hooks/useIotInfo'
import { useMobileInfo } from '@hooks/useMobileInfo'
import { useOnboardingBalnces } from '@hooks/useOnboardingBalances'
import { useReverseGeo } from '@hooks/useReverseGeo'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import MapboxGL from '@rnmapbox/maps'
import { parseH3BNLocation } from '@utils/h3'
import { removeDashAndCapitalize } from '@utils/hotspotNftsUtils'
import * as Logger from '@utils/logger'
import { MAX_MAP_ZOOM, MIN_MAP_ZOOM } from '@utils/mapbox'
import BN from 'bn.js'
import debounce from 'lodash/debounce'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native'
import { Config } from 'react-native-config'
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useDebounce } from 'use-debounce'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

const BUTTON_HEIGHT = 65
type Route = RouteProp<CollectableStackParamList, 'AssertLocationScreen'>x

const AssertLocationScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { collectable } = route.params
const entityKey = useEntityKey(collectable)
  const { info: iotInfoAcc } = useIotInfo(entityKey)
  const { info: mobileInfoAcc } = useMobileInfo(entityKey)
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const camera = useRef<MapboxGL.Camera>(null)
  const userLocation = useRef<MapboxGL.UserLocation>(null)
  const { showOKAlert } = useAlert()
  const [mapCenter, setMapCenter] = useState<number[]>()
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
  const collectNav = useNavigation<CollectableNavigationProp>()
  const {
    maker,
    makerDc,
    myDcWithHnt,
    loadingMyDc,
    loadingMakerDc,
    locationAssertDcRequirements,
    loadingLocationAssertDcRequirements,
  } = useOnboardingBalnces(entityKey)
  const { implicitBurn } = useImplicitBurn()
  const wallet = useCurrentWallet()
  const {
    content: { metadata },
  } = collectable

  const iotLocation = useMemo(() => {
    if (!iotInfoAcc?.location) {
      return undefined
    }
    return parseH3BNLocation(iotInfoAcc.location).reverse()
  }, [iotInfoAcc])

  const mobileLocation = useMemo(() => {
    if (!mobileInfoAcc?.location) {
      return undefined
    }

    return parseH3BNLocation(mobileInfoAcc.location).reverse()
  }, [mobileInfoAcc])

  const sameLocation = useMemo(() => {
    if (!iotLocation || !mobileLocation) {
      return false
    }

    return JSON.stringify(iotLocation) === JSON.stringify(mobileLocation)
  }, [iotLocation, mobileLocation])

  const [initialUserLocation, setInitialUserLocation] = useState<number[]>()
  useEffect(() => {
    const coords = userLocation?.current?.state?.coordinates
    if (!initialUserLocation && coords) {
      setInitialUserLocation(coords)
    }
  }, [
    initialUserLocation,
    setInitialUserLocation,
    userLocation?.current?.state?.coordinates,
  ])

  const initialCenter = useMemo(() => {
    return (
      iotLocation ||
      mobileLocation ||
      initialUserLocation || [-122.419418, 37.774929]
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserLocation, iotLocation, mobileLocation])

  useEffect(() => {
    if (!elevGainVisible) {
      if (iotInfoAcc?.gain) {
        setGain(`${iotInfoAcc?.gain / 10}`)
      }

      if (iotInfoAcc?.elevation) {
        setElevation(`${iotInfoAcc?.elevation}`)
      }
    }
  }, [iotInfoAcc, elevGainVisible, setGain, setElevation])

  const resetGain = useCallback(
    () => setGain(iotInfoAcc?.gain ? `${iotInfoAcc.gain / 10}` : undefined),
    [iotInfoAcc, setGain],
  )

  const resetElevation = useCallback(
    () =>
      setElevation(
        iotInfoAcc?.elevation ? `${iotInfoAcc.elevation}` : undefined,
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
    async (type: NetworkType) => {
      if (
        !mapCenter ||
        !entityKey ||
        loadingMakerDc ||
        loadingLocationAssertDcRequirements ||
        !wallet
      )
        return

      setTransactionError(undefined)
      setAsserting(true)
      try {
        hideElevGain()
        if (collectable.ownership.owner.toString() !== wallet.toBase58()) {
          throw new Error(t('assertLocationScreen.error.wrongOwner'))
        }
        const requiredDc =
          locationAssertDcRequirements[
            type === 'IOT' ? IOT_MINT.toBase58() : MOBILE_MINT.toBase58()
          ]
        const insufficientMakerDcBal = (makerDc || new BN(0)).lt(requiredDc)
        const insufficientMyDcBal =
          !loadingMyDc && (myDcWithHnt || new BN(0)).lt(requiredDc)

        let numLocationChanges = 0
        if (type === 'IOT') {
          numLocationChanges = iotInfoAcc?.numLocationAsserts || 0
        } else {
          numLocationChanges = mobileInfoAcc?.numLocationAsserts || 0
        }
        const isPayer =
          insufficientMakerDcBal ||
          !maker ||
          numLocationChanges >= maker.locationNonceLimit
        if (isPayer && insufficientMyDcBal) {
          throw new Error(
            t('assertLocationScreen.error.insufficientFunds', {
              usd: requiredDc.toNumber() / 100000,
            }),
          )
        }
        if (isPayer) {
          await implicitBurn(requiredDc.toNumber())
        }
        await submitUpdateEntityInfo({
          type,
          entityKey,
          lng: mapCenter[0],
          lat: mapCenter[1],
          elevation,
          decimalGain: gain,
          payer: isPayer ? wallet.toBase58() : undefined,
        })
        setAsserting(false)

        await showOKAlert({
          title: t('assertLocationScreen.success.title'),
          message: t('assertLocationScreen.success.message'),
        })
        collectNav.navigate('HotspotDetailsScreen', { collectable })
      } catch (error) {
        setAsserting(false)
        Logger.error(error)
        setTransactionError((error as Error).message)
      }
    },
    [
      maker,
      implicitBurn,
      wallet,
      mapCenter,
      entityKey,
      loadingMakerDc,
      loadingLocationAssertDcRequirements,
      hideElevGain,
      locationAssertDcRequirements,
      makerDc,
      loadingMyDc,
      myDcWithHnt,
      submitUpdateEntityInfo,
      elevation,
      gain,
      showOKAlert,
      t,
      collectNav,
      collectable,
      iotInfoAcc?.numLocationAsserts,
      mobileInfoAcc?.numLocationAsserts,
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
            onPress: async () => assertLocation('MOBILE'),
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
      await assertLocation('IOT')
    }
  }, [t, elevGainVisible, assertLocation])

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  const disabled = useMemo(
    () =>
      !mapCenter ||
      reverseGeo.loading ||
      asserting ||
      loadingLocationAssertDcRequirements ||
      loadingMakerDc ||
      loadingMyDc,
    [
      asserting,
      mapCenter,
      reverseGeo.loading,
      loadingLocationAssertDcRequirements,
      loadingMakerDc,
      loadingMyDc,
    ],
  )
  const [debouncedDisabled] = useDebounce(disabled, 300)
  const [reverseGeoLoading] = useDebounce(reverseGeo.loading, 300)

  return (
    <ReAnimatedBox entering={DelayedFadeIn} flex={1}>
      <BackScreen
        headerTopMargin="l"
        padding="none"
        title={t('assertLocationScreen.title')}
        backgroundImageUri={metadata?.image || ''}
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
                    {t('assertLocationScreen.mobileTitle')}:
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
                    <MapboxGL.eView
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
                    </MapboxGL.eView>
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
            {reverseGeoLoading && (
              <CircleLoader loaderSize={20} color="white" />
            )}
            {showError && (
              <Text variant="body3Medium" color="red500">
                {showError}
              </Text>
            )}
            {!reverseGeo.loading && !showError && (
              <FadeInOut>
                <Text variant="body3Medium" color="grey600">
                  {reverseGeo.result}
                </Text>
              </FadeInOut>
            )}
          </Box>
          <Box>
            <TouchableOpacityBox
              backgroundColor="surfaceContrast"
              borderRadius="round"
              paddingVertical="lm"
              disabled={disabled}
              height={65}
              alignItems="center"
              justifyContent="center"
              onPress={handleAssertLocationPress}
            >
              {debouncedDisabled || asserting ? (
                <CircleLoader loaderSize={19} color="black" />
              ) : (
                <Text
                  variant="subtitle2"
                  marginHorizontal="xs"
                  color="surfaceContrastText"
                >
                  {t('assertLocationScreen.title')}
                </Text>
              )}
            </TouchableOpacityBox>
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
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
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
                        floatingLabel={`${t(
                          'assertLocationScreen.gainPlaceholder',
                        )}`}
                        textInputProps={{
                          placeholder: t(
                            'assertLocationScreen.gainPlaceholder',
                          ),
                          onChangeText: setGain,
                          value: gain,
                          keyboardType: 'decimal-pad',
                        }}
                      />
                      <Box height={1} width="100%" backgroundColor="black200" />
                      <TextInput
                        variant="transparent"
                        floatingLabel={`${t(
                          'assertLocationScreen.elevationPlaceholder',
                        )}`}
                        textInputProps={{
                          placeholder: t(
                            'assertLocationScreen.elevationPlaceholder',
                          ),
                          onChangeText: setElevation,
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
            </TouchableWithoutFeedback>
          </BackScreen>
        </ReAnimatedBlurBox>
      ) : undefined}
    </ReAnimatedBox>
  )
}

export default memo(AssertLocationScreen) */
