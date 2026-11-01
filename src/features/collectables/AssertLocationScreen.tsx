import HexArt from '@assets/images/hex.svg'
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
import {
  CameraRef,
  LngLat,
  MapRef,
  Marker,
  useCurrentPosition,
} from '@maplibre/maplibre-react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { FADE_IN, FADE_OUT } from '@theme/motion'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { waitingOnHntPrice } from '@utils/dcWithHnt'
import { parseH3BNLocation } from '@utils/h3'
import { removeDashAndCapitalize } from '@utils/hotspotNftsUtils'
import * as Logger from '@utils/logger'
import BN from 'bn.js'
import { BlurView } from 'expo-blur'
import {
  ChevronLeft,
  LocateFixed,
  MapPin as MapPinGlyph,
  Search,
} from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import 'text-encoding-polyfill'
import { withUniwind } from 'uniwind'
import { useDebouncedCallback } from 'use-debounce'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import Map from './map/Map'
import { INITIAL_MAP_VIEW_STATE, MAX_MAP_ZOOM } from './map/utils'

const SafeArea = withUniwind(SafeAreaView)
const Blur = withUniwind(BlurView)
const AnimatedBlurView = withUniwind(Animated.createAnimatedComponent(BlurView))
const Hex = withUniwind(HexArt)
const BackIcon = withUniwind(ChevronLeft)
const MapPin = withUniwind(MapPinGlyph)
const SearchIcon = withUniwind(Search)
const UserLocationIcon = withUniwind(LocateFixed)

const BACK_EDGES: Edge[] = ['top']

type Route = RouteProp<CollectableStackParamList, 'AssertLocationScreen'>

const AssertLocationScreen = () => {
  const { t } = useTranslation()
  const route = useRoute<Route>()
  const { collectable } = route.params
  const entityKey = useEntityKey(collectable)
  const { info: iotInfoAcc } = useIotInfo(entityKey)
  const { info: mobileInfoAcc } = useMobileInfo(entityKey)
  const mapRef = useRef<MapRef>(null)
  const cameraRef = useRef<CameraRef>(null)
  const { showOKAlert } = useAlert()
  const [mapCenter, setMapCenter] = useState<number[]>()
  // An assert reads the centre stored last, not the one its render saw.
  const mapCenterRef = useRef<number[]>(undefined)
  const moveGeneration = useRef(0)
  const cameraMovingRef = useRef(false)
  const [cameraMoving, setCameraMoving] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchValue, setSearchValue] = useState<string>()
  const [elevGainVisible, setElevGainVisible] = useState(false)
  const [gain, setGain] = useState<string | undefined>(() =>
    iotInfoAcc?.gain ? `${iotInfoAcc.gain / 10}` : undefined,
  )
  const [elevation, setElevation] = useState<string | undefined>(() =>
    iotInfoAcc?.elevation ? `${iotInfoAcc.elevation}` : undefined,
  )
  const [asserting, setAsserting] = useState(false)
  const [transactionError, setTransactionError] = useState<string>()
  const reverseGeo = useReverseGeo(mapCenter)
  const forwardGeo = useForwardGeo()
  const { submitUpdateEntityInfo } = useSubmitTxn()
  const navigation = useNavigation<CollectableNavigationProp>()
  const {
    maker,
    makerDc,
    myDc,
    myDcWithHnt,
    loadingMyDc,
    loadingMyDcWithHnt,
    loadingMakerDc,
    locationAssertDcRequirements,
    loadingLocationAssertDcRequirements,
  } = useOnboardingBalnces(entityKey)
  const { implicitBurn } = useImplicitBurn()
  const wallet = useCurrentWallet()
  const {
    content: { metadata },
  } = collectable

  const iotLocation = iotInfoAcc?.location
    ? parseH3BNLocation(iotInfoAcc.location).reverse()
    : undefined

  const mobileLocation = mobileInfoAcc?.location
    ? parseH3BNLocation(mobileInfoAcc.location).reverse()
    : undefined

  const sameLocation =
    !!iotLocation &&
    !!mobileLocation &&
    JSON.stringify(iotLocation) === JSON.stringify(mobileLocation)

  const [initialUserLocation, setInitialUserLocation] = useState<number[]>()
  const initialCenterSet = useRef(false)

  const userLocation = useCurrentPosition()
  const userCoords = userLocation?.coords
  if (!initialUserLocation && userCoords) {
    setInitialUserLocation([userCoords.longitude, userCoords.latitude])
  }

  const initialCenter =
    iotLocation ||
    mobileLocation ||
    initialUserLocation ||
    INITIAL_MAP_VIEW_STATE.centerCoordinate

  useEffect(() => {
    if (
      initialCenter &&
      JSON.stringify(initialCenter) !==
        JSON.stringify(INITIAL_MAP_VIEW_STATE.centerCoordinate) &&
      !initialCenterSet.current
    ) {
      initialCenterSet.current = true
      void cameraRef.current?.setStop({
        center: initialCenter as LngLat,
        duration: 0,
      })
    }
  }, [initialCenter, cameraRef])

  const [prevIotInfoAcc, setPrevIotInfoAcc] = useState(iotInfoAcc)
  const [prevElevGainVisible, setPrevElevGainVisible] =
    useState(elevGainVisible)
  if (
    prevIotInfoAcc !== iotInfoAcc ||
    prevElevGainVisible !== elevGainVisible
  ) {
    setPrevIotInfoAcc(iotInfoAcc)
    setPrevElevGainVisible(elevGainVisible)
    if (!elevGainVisible) {
      if (iotInfoAcc?.gain) {
        setGain(`${iotInfoAcc?.gain / 10}`)
      }

      if (iotInfoAcc?.elevation) {
        setElevation(`${iotInfoAcc?.elevation}`)
      }
    }
  }

  const resetGain = () =>
    setGain(iotInfoAcc?.gain ? `${iotInfoAcc.gain / 10}` : undefined)

  const resetElevation = () =>
    setElevation(iotInfoAcc?.elevation ? `${iotInfoAcc.elevation}` : undefined)

  const handleSearchPress = () => {
    setSearchVisible(!searchVisible)
  }

  const hideSearch = () => {
    setSearchValue(undefined)
    setSearchVisible(false)
  }

  const hideElevGain = () => {
    setElevGainVisible(false)
    resetGain()
    resetElevation()
  }

  const handleOnSearch = async () => {
    if (searchValue) {
      try {
        const coords = await forwardGeo.execute(searchValue)

        if (cameraRef?.current && coords) {
          void cameraRef.current.setStop({
            duration: 500,
            easing: 'ease',
            center: coords as LngLat,
            zoom: MAX_MAP_ZOOM / 1.2,
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
  }

  const handleSearchSubmit = () => {
    if (searchValue) {
      void handleOnSearch().catch(console.error)
    }
  }

  const handleRegionChanged = useDebouncedCallback(async () => {
    if (mapRef?.current) {
      const generation = moveGeneration.current
      const center = await mapRef?.current.getCenter()
      if (generation !== moveGeneration.current) return
      if (JSON.stringify(center) !== JSON.stringify(mapCenterRef.current)) {
        mapCenterRef.current = center
        setMapCenter(center)
        setTransactionError(undefined)
        hideSearch()
      }
      cameraMovingRef.current = false
      setCameraMoving(false)
    }
  }, 200)

  // A new move drops the pending centre and any centre read still in flight,
  // so only a centre read after the camera settles is stored.
  const handleRegionWillChange = () => {
    moveGeneration.current += 1
    handleRegionChanged.cancel()
    cameraMovingRef.current = true
    setCameraMoving(true)
  }

  const handleUserLocationPress = () => {
    if (cameraRef?.current && userLocation?.coords) {
      void cameraRef.current.setStop({
        duration: 500,
        easing: 'ease',
        zoom: MAX_MAP_ZOOM,
        center: [userLocation?.coords.longitude, userLocation?.coords.latitude],
      })
    }
  }

  const iotNumLocationAsserts = iotInfoAcc?.numLocationAsserts
  const mobileNumLocationAsserts = mobileInfoAcc?.numLocationAsserts
  const assertLocation = async (type: NetworkType) => {
    const center = mapCenterRef.current
    if (
      !center ||
      cameraMovingRef.current ||
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
      // DC alone can cover the cost while the HNT price is missing
      const insufficientMyDcBal =
        !waitingOnHntPrice({ loadingMyDcWithHnt, myDc, requiredDc }) &&
        (myDcWithHnt || myDc || new BN(0)).lt(requiredDc)

      let numLocationChanges = 0
      if (type === 'IOT') {
        numLocationChanges = iotNumLocationAsserts || 0
      } else {
        numLocationChanges = mobileNumLocationAsserts || 0
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
        lng: center[0],
        lat: center[1],
        elevation,
        decimalGain: gain,
        payer: isPayer ? wallet.toBase58() : undefined,
      })
      setAsserting(false)

      await showOKAlert({
        title: t('assertLocationScreen.success.title'),
        message: t('assertLocationScreen.success.message'),
      })
      navigation.navigate(
        'HotspotMapScreen',
        { hotspot: collectable, network: type },
        { pop: true },
      )
    } catch (error) {
      setAsserting(false)
      Logger.error(error)
      setTransactionError((error as Error).message)
    }
  }

  const handleAssertLocationPress = async () => {
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
            onPress: () => void assertLocation('MOBILE'),
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
  }

  const showError = transactionError || undefined

  // The network is picked after the press, so wait for the larger cost
  const waitingOnPrice = waitingOnHntPrice({
    loadingMyDcWithHnt,
    myDc,
    requiredDc: BN.max(
      locationAssertDcRequirements[IOT_MINT.toBase58()] || new BN(0),
      locationAssertDcRequirements[MOBILE_MINT.toBase58()] || new BN(0),
    ),
  })

  const disabled =
    !mapCenter ||
    cameraMoving ||
    reverseGeo.loading ||
    asserting ||
    loadingLocationAssertDcRequirements ||
    loadingMakerDc ||
    loadingMyDc ||
    waitingOnPrice

  const isLoading =
    loadingMyDc ||
    waitingOnPrice ||
    loadingMakerDc ||
    loadingLocationAssertDcRequirements

  return (
    <View className="flex-1">
      <SafeArea edges={BACK_EDGES} className="flex-1">
        <View className="relative grow items-center justify-center overflow-hidden bg-secondary">
          <Blur
            className={`absolute h-full w-full flex-1 ${
              isLoading ? 'z-[100]' : 'z-0 hidden'
            }`}
            tint="dark"
            intensity={80}
          >
            <View className="h-full flex-1 justify-center">
              <Spinner colorClassName="accent-white" />
            </View>
          </Blur>
          <Map
            map={mapRef}
            camera={cameraRef}
            centerCoordinate={initialCenter}
            mapProps={{
              onPress: hideSearch,
              onRegionWillChange: handleRegionWillChange,
              onRegionDidChange: () => void handleRegionChanged(),
            }}
          >
            {(sameLocation ? [iotLocation] : [iotLocation, mobileLocation])
              .map((location, i) => {
                if (
                  !location ||
                  location.length < 2 ||
                  typeof location[0] !== 'number' ||
                  typeof location[1] !== 'number' ||
                  Number.isNaN(location[0]) ||
                  Number.isNaN(location[1])
                ) {
                  return null
                }

                const key = `MarkerView-${i + 1}-${location[0]}-${location[1]}`
                return (
                  <Marker
                    key={key}
                    id={`MarkerView-${i + 1}`}
                    lngLat={[location[0], location[1]]}
                  >
                    {sameLocation ? (
                      <View className="flex-row">
                        <View className="relative h-4 w-2 overflow-hidden">
                          <View className="absolute left-0">
                            <Hex
                              width={16}
                              height={16}
                              colorClassName="accent-success-500"
                            />
                          </View>
                        </View>
                        <View className="relative h-4 w-2 overflow-hidden">
                          <View className="absolute -left-2">
                            <Hex
                              width={16}
                              height={16}
                              colorClassName="accent-blue-dark-500"
                            />
                          </View>
                        </View>
                      </View>
                    ) : (
                      <Hex
                        width={16}
                        height={16}
                        colorClassName={
                          i === 0
                            ? 'accent-success-500'
                            : 'accent-blue-dark-500'
                        }
                      />
                    )}
                  </Marker>
                )
              })
              .filter(Boolean)}
          </Map>
          <View className="absolute top-0 w-full flex-row items-center pl-3 pt-6">
            <PressableScale
              feedback="opacity"
              className="flex-row items-center justify-center"
              onPress={() => navigation.goBack()}
            >
              <BackIcon size={24} colorClassName="accent-white" />
              <Text size="base" className="ml-3 font-medium text-white">
                Back
              </Text>
            </PressableScale>
          </View>
          <View className="absolute bottom-[50%] flex-col justify-center">
            <MapPin size={30} colorClassName="accent-white" />
          </View>
          {!searchVisible ? (
            <View className="absolute bottom-5 mx-3 w-full flex-row justify-between">
              <View className="mx-3 shrink flex-row items-center">
                {reverseGeo.loading && (
                  <View className={reverseGeo.result ? 'mr-3' : undefined}>
                    <Spinner colorClassName="accent-white" />
                  </View>
                )}
                {showError && (
                  <Text size="xs" className="font-medium text-destructive">
                    {showError}
                  </Text>
                )}
                {!reverseGeo.loading && !showError && reverseGeo.result && (
                  <Animated.View entering={FADE_IN} exiting={FADE_OUT}>
                    <View className="min-h-9 shrink flex-row items-center rounded-full bg-white/30 px-3 py-1.5">
                      <Text
                        size="xs"
                        className="font-medium text-white"
                        numberOfLines={1}
                      >
                        {reverseGeo.result}
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </View>
              <View className="mx-3 shrink-0 flex-row items-center justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-3 rounded-full bg-white/30"
                  onPress={handleSearchPress}
                >
                  <SearchIcon size={18} colorClassName="accent-foreground" />
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
          ) : (
            <View className="flex-1">
              <KeyboardAvoidingView className="flex-1">
                <View className="w-full flex-row items-center bg-secondary pl-3">
                  <SearchIcon
                    size={18}
                    colorClassName="accent-muted-foreground"
                  />
                  <Input
                    className="flex-1 border-0"
                    placeholder={t('assertLocationScreen.searchLocation')}
                    onChangeText={setSearchValue}
                    onSubmitEditing={handleSearchSubmit}
                    value={searchValue}
                    autoCorrect={false}
                    autoComplete="off"
                    autoFocus
                  />
                </View>
              </KeyboardAvoidingView>
            </View>
          )}
        </View>
        {!searchVisible && (
          <View className="-mt-2.5 rounded-t-[12px] bg-secondary p-3">
            <View className="mb-4 flex-row">
              <Image
                className="mr-3 h-[60px] w-[60px] rounded-lg"
                source={{
                  uri: metadata?.image,
                  cache: 'force-cache',
                }}
              />
              <View className="flex-1">
                <View className="flex-row items-center">
                  {metadata?.name && (
                    <Text
                      size="2xl"
                      className="font-bold text-foreground"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {removeDashAndCapitalize(metadata.name)}
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center">
                  <View className="mr-4 flex-row items-center">
                    <Text className="mr-2 font-medium text-muted-foreground">
                      IOT:
                    </Text>
                    <Hex
                      width={16}
                      height={16}
                      colorClassName="accent-success-500"
                    />
                  </View>
                  <View className="mr-4 flex-row items-center">
                    <Text className="mr-2 font-medium text-muted-foreground">
                      {t('assertLocationScreen.mobileTitle')}:
                    </Text>
                    <Hex
                      width={16}
                      height={16}
                      colorClassName={
                        mobileLocation
                          ? 'accent-blue-dark-500'
                          : 'accent-border'
                      }
                    />
                  </View>
                </View>
              </View>
            </View>
            <Button
              variant="cta"
              size="lg"
              className="w-full"
              disabled={disabled}
              onPress={() =>
                void handleAssertLocationPress().catch(console.error)
              }
            >
              {disabled || asserting ? (
                <Spinner colorClassName="accent-white" />
              ) : (
                t('assertLocationScreen.title')
              )}
            </Button>
          </View>
        )}
        {elevGainVisible ? (
          <>
            {/* This is because Android sucks and does not support expo blur and the experimental feature is trash :) */}
            {Platform.OS === 'android' && (
              <View className="absolute left-0 top-0 z-0 h-full w-full bg-black" />
            )}
            <AnimatedBlurView
              entering={FADE_IN}
              className="absolute bottom-0 h-full w-full flex-row"
              tint="dark"
              intensity={80}
            >
              <TouchableWithoutFeedback
                onPress={() => Keyboard.dismiss()}
                accessibilityRole="button"
              >
                <View className="flex-1">
                  <KeyboardAvoidingView className="flex-1" behavior="padding">
                    <View className="mx-3 h-full flex-1 bg-transparent">
                      <View className="h-full flex-1 justify-center">
                        <Text
                          size="lg"
                          className="text-left font-medium text-white"
                          adjustsFontSizeToFit
                        >
                          {t('assertLocationScreen.antennaSetup')}
                        </Text>
                        <Text className="mb-4 font-medium text-muted-foreground">
                          {t('assertLocationScreen.antennaSetupDescription')}
                        </Text>
                        <View className="w-full rounded-[12px] bg-secondary px-3 py-1">
                          <Text
                            size="xs"
                            className="pt-2 text-muted-foreground"
                          >
                            {t('assertLocationScreen.gainPlaceholder')}
                          </Text>
                          <Input
                            className="border-0 px-0"
                            placeholder={t(
                              'assertLocationScreen.gainPlaceholder',
                            )}
                            onChangeText={setGain}
                            value={gain}
                            keyboardType="decimal-pad"
                          />
                          <View className="h-px w-full bg-border" />
                          <Text
                            size="xs"
                            className="pt-2 text-muted-foreground"
                          >
                            {t('assertLocationScreen.elevationPlaceholder')}
                          </Text>
                          <Input
                            className="border-0 px-0"
                            placeholder={t(
                              'assertLocationScreen.elevationPlaceholder',
                            )}
                            onChangeText={setElevation}
                            value={elevation}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                    </View>
                  </KeyboardAvoidingView>
                  <View className="p-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="grow"
                      disabled={
                        asserting ||
                        cameraMoving ||
                        loadingMyDc ||
                        waitingOnPrice
                      }
                      onPress={() =>
                        void handleAssertLocationPress().catch(console.error)
                      }
                    >
                      {asserting ? '' : t('assertLocationScreen.title')}
                    </Button>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </AnimatedBlurView>
          </>
        ) : undefined}
      </SafeArea>
    </View>
  )
}

export default AssertLocationScreen
