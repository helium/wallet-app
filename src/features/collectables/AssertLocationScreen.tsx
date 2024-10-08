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
import 'text-encoding-polyfill'
import { useDebounce } from 'use-debounce'
import { useColors, useCreateOpacity, useSpacing } from '@theme/themeHooks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'

type Route = RouteProp<CollectableStackParamList, 'AssertLocationScreen'>

const AssertLocationScreen = () => {
  const { t } = useTranslation()
  const { bottom } = useSafeAreaInsets()
  const spacing = useSpacing()
  const route = useRoute<Route>()
  const { backgroundStyle } = useCreateOpacity()
  const { collectable } = route.params
  const entityKey = useEntityKey(collectable)
  const { info: iotInfoAcc } = useIotInfo(entityKey)
  const { info: mobileInfoAcc } = useMobileInfo(entityKey)
  const mapRef = useRef<MapLibreGL.MapView>(null)
  const cameraRef = useRef<MapLibreGL.Camera>(null)
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

  const [userLocation, setUserLocation] = useState<MapLibreGL.Location>()
  const onUserLocationUpdate = useCallback(
    (loc: MapLibreGL.Location) => {
      setUserLocation(loc)
    },
    [setUserLocation],
  )

  useEffect(() => {
    const coords = userLocation?.coords
    if (!initialUserLocation && coords) {
      setInitialUserLocation([coords.longitude, coords.latitude])
    }
  }, [initialUserLocation, setInitialUserLocation, userLocation?.coords])

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
    if (cameraRef?.current && userLocation?.coords) {
      cameraRef.current.setCamera({
        animationDuration: 500,
        zoomLevel: MAX_MAP_ZOOM,
        centerCoordinate: userLocation?.coords,
      })
    }
  }, [cameraRef, userLocation?.coords])

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
      <Box flex={1}>
        <Box
          flexGrow={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="bg.tertiary"
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
              <CircleLoader loaderSize={24} color="primaryText" />
            </Box>
          </ReAnimatedBlurBox>
          <Map
            map={mapRef}
            camera={cameraRef}
            onUserLocationUpdate={onUserLocationUpdate}
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
                              color={colors['blue.light-500']}
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
            paddingTop="6xl"
            paddingLeft="5"
            top={0}
          >
            <TouchableOpacityBox
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              onPress={() => navigation.goBack()}
            >
              <BackArrow color={colors.primaryBackground} />
              <Text
                variant="textMdMedium"
                color="primaryBackground"
                marginLeft="3"
              >
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
          {!searchVisible ? (
            <Box
              flexDirection="row"
              justifyContent="space-between"
              position="absolute"
              marginHorizontal="3"
              width="100%"
              bottom={20}
            >
              <Box
                flexShrink={1}
                flexDirection="row"
                alignItems="center"
                marginHorizontal="3"
              >
                {reverseGeoLoading && (
                  <Box>
                    <CircleLoader
                      loaderSize={20}
                      color="primaryText"
                      marginRight={reverseGeo.result ? '3' : 'none'}
                    />
                  </Box>
                )}
                {showError && (
                  <Text variant="textXsMedium" color="error.500">
                    {showError}
                  </Text>
                )}
                {!reverseGeoLoading && !showError && reverseGeo.result && (
                  <FadeInOut>
                    <Box
                      flexShrink={1}
                      style={backgroundStyle('base.white', 0.3)}
                      flexDirection="row"
                      alignItems="center"
                      paddingHorizontal="3"
                      paddingVertical="1.5"
                      borderRadius="full"
                      minHeight={36}
                    >
                      <Text
                        variant="textXsMedium"
                        color="primaryText"
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
                marginHorizontal="3"
              >
                <FabButton
                  icon="search"
                  backgroundColor="base.white"
                  backgroundColorOpacity={0.3}
                  backgroundColorOpacityPressed={0.5}
                  marginRight="3"
                  width={36}
                  height={36}
                  justifyContent="center"
                  onPress={handleSearchPress}
                />
                <FabButton
                  icon="mapUserLocation"
                  backgroundColor="base.white"
                  backgroundColorOpacity={0.3}
                  backgroundColorOpacityPressed={0.5}
                  width={36}
                  height={36}
                  justifyContent="center"
                  onPress={handleUserLocationPress}
                />
              </Box>
            </Box>
          ) : (
            <Box flex={1}>
              <KeyboardAvoidingView style={{ flex: 1 }}>
                <SearchInput
                  placeholder={t('assertLocationScreen.searchLocation')}
                  onChangeText={setSearchValue}
                  onEnter={handleOnSearch}
                  value={searchValue}
                  width="100%"
                  borderRadius="none"
                  autoFocus
                />
              </KeyboardAvoidingView>
            </Box>
          )}
        </Box>
        {!searchVisible && (
          <Box
            style={{
              marginTop: -10,
            }}
            backgroundColor="bg.tertiary"
            borderTopLeftRadius="2xl"
            borderTopRightRadius="2xl"
            padding="3"
          >
            <Box flexDirection="row" marginBottom="4">
              <ImageBox
                borderRadius="2xl"
                height={60}
                width={60}
                mr="3"
                source={{
                  uri: metadata?.image,
                  cache: 'force-cache',
                }}
              />
              <Box flex={1}>
                <Box flexDirection="row" alignItems="center">
                  {metadata?.name && (
                    <Text
                      variant="displayXsBold"
                      color="primaryText"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {removeDashAndCapitalize(metadata.name)}
                    </Text>
                  )}
                </Box>
                <Box flexDirection="row" alignItems="center">
                  <Box flexDirection="row" alignItems="center" marginRight="4">
                    <Text
                      variant="textSmMedium"
                      color="secondaryText"
                      marginRight="2"
                    >
                      IOT:
                    </Text>
                    <Hex
                      width={16}
                      height={16}
                      color={colors['green.light-500']}
                    />
                  </Box>
                  <Box flexDirection="row" alignItems="center" marginRight="4">
                    <Text
                      variant="textSmMedium"
                      color="secondaryText"
                      marginRight="2"
                    >
                      {t('assertLocationScreen.mobileTitle')}:
                    </Text>
                    <Hex
                      width={16}
                      height={16}
                      color={
                        mobileLocation
                          ? colors['blue.light-500']
                          : colors['gray.700']
                      }
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
            <TouchableOpacityBox
              width="100%"
              backgroundColor="primaryText"
              borderRadius="full"
              paddingVertical="5"
              disabled={disabled}
              height={65}
              alignItems="center"
              justifyContent="center"
              onPress={handleAssertLocationPress}
              style={{
                marginBottom: bottom + spacing['0.5'],
              }}
            >
              {debouncedDisabled || asserting ? (
                <CircleLoader loaderSize={19} color="primaryBackground" />
              ) : (
                <Text
                  variant="textLgMedium"
                  marginHorizontal="xs"
                  color="primaryBackground"
                >
                  {t('assertLocationScreen.title')}
                </Text>
              )}
            </TouchableOpacityBox>
          </Box>
        )}
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
                    marginHorizontal="3"
                  >
                    <Box flex={1} justifyContent="center" height="100%">
                      <Text
                        textAlign="left"
                        variant="textLgMedium"
                        adjustsFontSizeToFit
                      >
                        {t('assertLocationScreen.antennaSetup')}
                      </Text>
                      <Text
                        variant="textSmMedium"
                        color="secondaryText"
                        marginBottom="4"
                      >
                        {t('assertLocationScreen.antennaSetupDescription')}
                      </Text>
                      <Box
                        width="100%"
                        backgroundColor="secondaryBackground"
                        borderRadius="2xl"
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
                          backgroundColor="gray.true-700"
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
                <Box padding="3" marginBottom="6xl">
                  <ButtonPressable
                    flexGrow={1}
                    borderRadius="full"
                    backgroundColor="primaryText"
                    backgroundColorOpacityPressed={0.7}
                    backgroundColorDisabled="base.white"
                    backgroundColorDisabledOpacity={0.0}
                    titleColorDisabled="gray.600"
                    title={asserting ? '' : t('assertLocationScreen.title')}
                    titleColor="primaryBackground"
                    onPress={handleAssertLocationPress}
                  />
                </Box>
              </Box>
            </TouchableWithoutFeedback>
          </ReAnimatedBlurBox>
        ) : undefined}
      </Box>
    </ReAnimatedBox>
  )
}

export default memo(AssertLocationScreen)
