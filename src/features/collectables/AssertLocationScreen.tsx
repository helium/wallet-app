import BackArrow from '@assets/images/backArrow.svg'
import Hex from '@assets/images/hex.svg'
import MapPin from '@assets/images/mapPin.svg'
import {
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
import Map from '@components/map/Map'
import { INITIAL_MAP_VIEW_STATE, MAX_MAP_ZOOM } from '@components/map/utils'
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
import MapLibreGL from '@maplibre/maplibre-react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { parseH3BNLocation } from '@utils/h3'
import { removeDashAndCapitalize } from '@utils/hotspotNftsUtils'
import * as Logger from '@utils/logger'
import BN from 'bn.js'
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
import { Edge } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { useDebounce } from 'use-debounce'
import { useColors, useCreateOpacity } from '@theme/themeHooks'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

type Route = RouteProp<CollectableStackParamList, 'AssertLocationScreen'>

const AssertLocationScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { backgroundStyle } = useCreateOpacity()
  const { collectable } = route.params
  const entityKey = useEntityKey(collectable)
  const { info: iotInfoAcc } = useIotInfo(entityKey)
  const { info: mobileInfoAcc } = useMobileInfo(entityKey)
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const cameraRef = useRef<MapLibreGL.Camera>(null)
  const userLocationRef = useRef<MapLibreGL.UserLocation>(null)
  const { showOKAlert } = useAlert()
  const colors = useColors()
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
  const navigation = useNavigation<CollectableNavigationProp>()
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
  const [initialCenterSet, setInitalCenter] = useState(false)

  useEffect(() => {
    const coords = userLocationRef?.current?.state?.coordinates
    if (!initialUserLocation && coords) {
      setInitialUserLocation(coords)
    }
  }, [
    initialUserLocation,
    setInitialUserLocation,
    userLocationRef?.current?.state?.coordinates,
  ])

  const initialCenter = useMemo(() => {
    return (
      iotLocation ||
      mobileLocation ||
      initialUserLocation ||
      INITIAL_MAP_VIEW_STATE.centerCoordinate
    )
  }, [initialUserLocation, iotLocation, mobileLocation])

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

    hideSearch()
  }, [cameraRef, t, hideSearch, searchValue, forwardGeo, showOKAlert])

  const handleRegionChanged = useCallback(async () => {
    if (mapRef?.current) {
      const center = await mapRef?.current.getCenter()
      if (JSON.stringify(center) !== JSON.stringify(mapCenter)) {
        setMapCenter(center)
        setTransactionError(undefined)
        hideSearch()
      }
    }
  }, [mapRef, mapCenter, setMapCenter, hideSearch])

  const handleUserLocationPress = useCallback(() => {
    if (cameraRef?.current && userLocationRef?.current?.state.coordinates) {
      cameraRef.current.setCamera({
        animationDuration: 500,
        zoomLevel: MAX_MAP_ZOOM,
        centerCoordinate: userLocationRef.current.state.coordinates,
      })
    }
  }, [userLocationRef, cameraRef])

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
        navigation.navigate('HotspotMapScreen', {
          hotspot: collectable,
          network: type,
        })
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
      navigation,
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

  const isLoading = useMemo(
    () => loadingMyDc || loadingMakerDc || loadingLocationAssertDcRequirements,
    [loadingMyDc, loadingMakerDc, loadingLocationAssertDcRequirements],
  )

  const [debouncedDisabled] = useDebounce(disabled, 300)
  const [reverseGeoLoading] = useDebounce(reverseGeo.loading, 300)

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
            flex={1}
            width="100%"
            height="100%"
            zIndex={isLoading ? 100 : 0}
          >
            <Box flex={1} height="100%" justifyContent="center">
              <CircleLoader loaderSize={24} color="white" />
            </Box>
          </ReAnimatedBlurBox>
          <Map
            map={mapRef}
            camera={cameraRef}
            userLocation={userLocationRef}
            centerCoordinate={initialCenter}
            mapProps={{
              onPress: hideSearch,
              onRegionDidChange: handleRegionChanged,
            }}
          >
            {(sameLocation ? [iotLocation] : [iotLocation, mobileLocation])
              .map((location, i) => {
                if (!location || location.length < 2) return null

                return (
                  <MapLibreGL.MarkerView
                    key={`MarkerView-${i + 1}`}
                    allowOverlap
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
                              color={colors.greenBright500}
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
                              color={colors.blueBright500}
                            />
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      <Hex
                        width={16}
                        height={16}
                        color={
                          i === 0 ? colors.greenBright500 : colors.blueBright500
                        }
                      />
                    )}
                  </MapLibreGL.MarkerView>
                )
              })
              .filter(Boolean)}
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
                Back
              </Text>
            </TouchableOpacityBox>
          </Box>
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
            justifyContent="space-between"
            position="absolute"
            marginHorizontal="ms"
            width="100%"
            bottom={!searchVisible ? 20 : 0}
          >
            {!searchVisible ? (
              <>
                <Box
                  flexShrink={1}
                  flexDirection="row"
                  alignItems="center"
                  marginHorizontal="ms"
                >
                  {reverseGeoLoading && (
                    <Box>
                      <CircleLoader
                        loaderSize={20}
                        color="white"
                        marginRight={reverseGeo.result ? 'ms' : 'none'}
                      />
                    </Box>
                  )}
                  {showError && (
                    <Text variant="body3Medium" color="red500">
                      {showError}
                    </Text>
                  )}
                  {!reverseGeoLoading && !showError && reverseGeo.result && (
                    <FadeInOut>
                      <Box
                        flexShrink={1}
                        style={backgroundStyle('white', 0.3)}
                        flexDirection="row"
                        alignItems="center"
                        paddingHorizontal="ms"
                        paddingVertical="sx"
                        borderRadius="round"
                        minHeight={36}
                      >
                        <Text
                          variant="body3Medium"
                          color="white"
                          numberOfLines={1}
                        >
                          {reverseGeo.result}
                        </Text>
                      </Box>
                    </FadeInOut>
                  )}
                </Box>
                <Box
                  flexShrink={0}
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="flex-end"
                  marginHorizontal="ms"
                >
                  <FabButton
                    icon="search"
                    backgroundColor="white"
                    backgroundColorOpacity={0.3}
                    backgroundColorOpacityPressed={0.5}
                    marginRight="ms"
                    width={36}
                    height={36}
                    justifyContent="center"
                    onPress={handleSearchPress}
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
              </>
            ) : (
              <SearchInput
                paddingBottom="s"
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
        </Box>
        <Box
          style={{
            marginTop: -10,
          }}
          backgroundColor="surfaceSecondary"
          borderTopLeftRadius="l"
          borderTopRightRadius="l"
          padding="ms"
        >
          <Box flexDirection="row" marginBottom="m">
            <ImageBox
              borderRadius="lm"
              height={60}
              width={60}
              mr="ms"
              source={{
                uri: metadata?.image,
                cache: 'force-cache',
              }}
            />
            <Box flex={1}>
              <Box flexDirection="row" alignItems="center">
                {metadata?.name && (
                  <Text
                    variant="h3Bold"
                    color="white"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {removeDashAndCapitalize(metadata.name)}
                  </Text>
                )}
              </Box>
              <Box flexDirection="row" alignItems="center">
                <Box flexDirection="row" alignItems="center" marginRight="m">
                  <Text
                    variant="subtitle4"
                    color="secondaryText"
                    marginRight="s"
                  >
                    IOT:
                  </Text>
                  <Hex width={16} height={16} color={colors.greenBright500} />
                </Box>
                <Box flexDirection="row" alignItems="center" marginRight="m">
                  <Text
                    variant="subtitle4"
                    color="secondaryText"
                    marginRight="s"
                  >
                    {t('assertLocationScreen.mobileTitle')}:
                  </Text>
                  <Hex
                    width={16}
                    height={16}
                    color={
                      mobileLocation ? colors.blueBright500 : colors.darkGrey
                    }
                  />
                </Box>
              </Box>
            </Box>
          </Box>
          <TouchableOpacityBox
            width="100%"
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
        {elevGainVisible ? (
          <ReAnimatedBlurBox
            visible={elevGainVisible}
            entering={FadeInFast}
            flexDirection="row"
            position="absolute"
            bottom={0}
            height="100%"
            width="100%"
          >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <Box flex={1}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                  <Box
                    backgroundColor="transparent"
                    flex={1}
                    height="100%"
                    marginHorizontal="ms"
                  >
                    <Box flex={1} justifyContent="center" height="100%">
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
                        <Box
                          height={1}
                          width="100%"
                          backgroundColor="black200"
                        />
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
                  </Box>
                </KeyboardAvoidingView>
                <Box padding="ms">
                  <ButtonPressable
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
              </Box>
            </TouchableWithoutFeedback>
          </ReAnimatedBlurBox>
        ) : undefined}
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default memo(AssertLocationScreen)
