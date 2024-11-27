import HeliumBottomSheet from '@components/HeliumBottomSheet'
import React, {
  createContext,
  forwardRef,
  Ref,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet'
import { useSpacing } from '@config/theme/themeHooks'
import { Platform } from 'react-native'
import { wh, wp } from '@utils/layout'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Carousel } from 'react-native-snap-carousel'
import BackButton from '@assets/svgs/modalBackButton.svg'
import Box from '@components/Box'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { appSlice } from '@store/slices/appSlice'
import { useAppDispatch } from '@store/store'
import Config from 'react-native-config'
import { useAsyncCallback } from 'react-async-hook'
import { Portal } from '@gorhom/portal'
import { ThemeProvider } from '@shopify/restyle'
import { lightTheme } from '@config/theme/theme'
import { HotspotBleProvider } from '@helium/react-native-sdk'
import SelectNetworkScreen from './screens/SelectNetworkScreen'
import SelectDeviceScreen from './screens/mobile/SelectDeviceScreen'
import KeepYourBoxScreen from './screens/mobile/KeepYourBoxScreen'
import ConnectEthernetScreen from './screens/mobile/ConnectEthernetScreen'
import ConnectToHotspotScreen from './screens/mobile/ConnectToHotspotScreen'
import ScanQRCodeScreen from './screens/mobile/ScanQRCodeScreen'
import AcquireLocationScreen from './screens/mobile/AcquireLocationScreen'
import SelectFloorScreen from './screens/SelectFloorScreen'
import SetDirectionScreen from './screens/mobile/SetDirectionScreen'
import AddToWalletScreenMobile from './screens/mobile/AddToWalletScreen'
import AddToWalletScreenIot from './screens/iot/AddToWalletScreen'
import ManualEntryScreen from './screens/mobile/ManualEntryScreen'
import {
  OnboardingV3Client,
  DeviceInfo,
  HmhOnboardParams,
  VendorSlugs,
} from './OnboardingV3Client'
import ScanHotspots from './screens/iot/ScanHotspots'
import WifiSettings from './screens/iot/WifiSettings'
import WifiSetup from './screens/iot/WifiSetup'
import HotspotConnected from './screens/iot/HotspotConnected'
import SelectLocationScreen from './screens/SelectLocationScreen'
import ConnectViaBluetoothScreen from './screens/iot/ConnectViaBluetoothScreen'

export type OnboardingSheetRef = {
  show: () => void
  hide: () => void
}

type CarouselItem = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Screen: (ScreenProps) => React.JSX.Element
}

type Network = 'mobile' | 'iot'

export type DeviceType = 'WifiIndoor' | 'WifiOutdoor'

export type OnboardDetails = {
  network: Network
  deviceInfo: DeviceInfo
  iotDetails: OnboardIotDetails
  latitude: number
  longitude: number
  height: number
  qrCode: string
  azimuth: number
}

export type OnboardIotDetails = {
  network: string
  onboardingAddress: string
  animalName: string
}

type HotspotOnboarding = {
  onboardDetails: OnboardDetails
  manualEntry: boolean
  carouselRef: RefObject<Carousel<CarouselItem>> | null
  setOnboardDetails: React.Dispatch<React.SetStateAction<OnboardDetails>>
  setManualEntry: (manualEntry: boolean) => void
  getDeviceInfo: (qrCode: string) => Promise<DeviceInfo | undefined>
  getDeviceInfoLoading: boolean
  getDeviceInfoError: Error | undefined
  onboardDevice: ({
    walletAddress,
    device,
  }: {
    walletAddress: string
    device: HmhOnboardParams
  }) => Promise<boolean>
  onboardDeviceLoading: boolean
  onboardDeviceError: Error | undefined
}

const useHotspotOnboardingHook = (): HotspotOnboarding => {
  const [onboardDetails, setOnboardDetails] = useState<OnboardDetails>({
    network: 'mobile',
    latitude: 0,
    longitude: 0,
    height: 0,
    qrCode: '',
    azimuth: 0,
    iotDetails: {
      network: '',
      onboardingAddress: '',
      animalName: '',
    },
    deviceInfo: {
      serialNumber: '',
      heliumPubKey: '',
      maker: VendorSlugs.HELIUM_MOBILE,
      deviceType: 'WifiIndoor',
      sku: '',
      animalName: '',
    },
  })
  const [manualEntry, setManualEntry] = useState<boolean>(false)

  const clientRef = useRef<OnboardingV3Client>()

  const lazyGetClient = useCallback(async () => {
    if (clientRef.current) {
      return clientRef.current
    }

    const nextClient = new OnboardingV3Client(
      Config.ONBOARDING_V3_URL || '',
      Config.ONBOARDING_V3_API_KEY || '',
    )

    clientRef.current = nextClient
    return nextClient
  }, [])

  const {
    execute: getDeviceInfo,
    loading: getDeviceInfoLoading,
    error: getDeviceInfoError,
  } = useAsyncCallback(async (qrCode: string) => {
    const client = await lazyGetClient()
    const deviceInfo = await client.getDeviceInfo(qrCode)

    setOnboardDetails((o) => ({
      ...o,
      qrCode,
      deviceInfo,
    }))

    return deviceInfo
  })

  const {
    execute: onboardDevice,
    loading: onboardDeviceLoading,
    error: onboardDeviceError,
  } = useAsyncCallback(
    async ({
      walletAddress,
      device,
    }: {
      walletAddress: string
      device: HmhOnboardParams
    }) => {
      const client = await lazyGetClient()

      const response = await client.onboardDevice(walletAddress, device)

      return response
    },
  )

  return {
    onboardDetails,
    manualEntry,
    setOnboardDetails,
    setManualEntry,
    carouselRef: null,
    getDeviceInfo,
    onboardDevice,
    onboardDeviceLoading,
    onboardDeviceError,
    getDeviceInfoLoading,
    getDeviceInfoError,
  }
}

export type HotspotOnboardingManager = ReturnType<
  typeof useHotspotOnboardingHook
>

const HotspotOnboardingContext = createContext<HotspotOnboardingManager | null>(
  null,
)

const { Provider } = HotspotOnboardingContext

const HotspotOnboardingProvider = forwardRef(
  (_, ref: Ref<OnboardingSheetRef>) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const [visible, setVisible] = useState(false)

    const hookValues = useHotspotOnboardingHook()
    const { manualEntry, onboardDetails } = hookValues
    const bottomSheetRef = useRef<BottomSheet>(null)
    const carouselRef = useRef<Carousel<CarouselItem>>(null)
    const { top } = useSafeAreaInsets()
    const spacing = useSpacing()
    const dispatch = useAppDispatch()
    const [currentIndex, setCurrentIndex] = useState(0)

    const iotSelected = useMemo(() => {
      return onboardDetails.network === 'iot'
    }, [onboardDetails])

    const show = useCallback(() => {
      setVisible(true)
    }, [])

    const hide = useCallback(() => {
      bottomSheetRef.current?.close()
    }, [bottomSheetRef])

    useEffect(() => {
      return () => {
        dispatch(appSlice.actions.setRootSheetPosition(undefined))
      }
    }, [dispatch])

    const snapPoints = useMemo(() => {
      if (Platform.OS === 'ios') {
        return [wh - top - spacing[20]]
      }

      return [wh - top - spacing[20] - spacing[2]]
    }, [top, spacing])

    const onBack = useCallback(() => {
      if (carouselRef.current?.currentIndex === 0) {
        bottomSheetRef.current?.close()
        return
      }

      carouselRef.current?.snapToPrev()
    }, [carouselRef, bottomSheetRef])

    const slides = useMemo(() => {
      const pages = [
        {
          Screen: SelectNetworkScreen,
        },
      ]

      if (iotSelected) {
        pages.push(
          ...[
            {
              Screen: ConnectViaBluetoothScreen,
            },
            {
              Screen: ScanHotspots,
            },
            {
              Screen: WifiSettings,
            },
            {
              Screen: WifiSetup,
            },
            {
              Screen: HotspotConnected,
            },
            {
              Screen: SelectLocationScreen,
            },
            {
              Screen: SelectFloorScreen,
            },
          ],
        )
      }

      if (!iotSelected) {
        pages.push(
          ...[
            {
              Screen: SelectDeviceScreen,
            },
            {
              Screen: KeepYourBoxScreen,
            },
            {
              Screen: ConnectEthernetScreen,
            },
            {
              Screen: ConnectToHotspotScreen,
            },
          ],
        )
      }

      if (!iotSelected) {
        if (manualEntry) {
          pages.push({
            Screen: ManualEntryScreen,
          })
        } else {
          pages.push({
            Screen: ScanQRCodeScreen,
          })
        }
      }

      if (!iotSelected) {
        pages.push(
          ...[
            {
              Screen: AcquireLocationScreen,
            },
            {
              Screen: SelectFloorScreen,
            },
          ],
        )
      }

      if (onboardDetails.deviceInfo.deviceType === 'WifiOutdoor') {
        pages.push({
          Screen: SetDirectionScreen,
        })
      }

      pages.push({
        Screen: iotSelected ? AddToWalletScreenIot : AddToWalletScreenMobile,
      })

      return pages
    }, [manualEntry, onboardDetails, iotSelected])

    const renderCarouselItem = useCallback(
      // eslint-disable-next-line react/no-unused-prop-types
      ({ item: { Screen }, index }: { item: CarouselItem; index: number }) => {
        // Only render the screen if the index is the current one or one before or after
        if (
          currentIndex === index ||
          currentIndex === index - 1 ||
          currentIndex === index + 1
        ) {
          return <Screen />
        }
      },
      [currentIndex],
    )

    const onChange = useCallback((index) => {
      setVisible(index === 0)
      if (index === -1) {
        setCurrentIndex(0)
      }
    }, [])

    const onAnimate = useCallback(
      (index) => {
        dispatch(appSlice.actions.setRootSheetPosition(index === 0 ? 0 : wh))
      },
      [dispatch],
    )

    return (
      <HotspotBleProvider>
        <Provider
          value={{
            ...hookValues,
            carouselRef,
          }}
        >
          {visible && (
            <HeliumBottomSheet
              index={0}
              ref={bottomSheetRef}
              snapPoints={snapPoints}
              enableOverDrag={false}
              onChange={onChange}
              onAnimate={onAnimate}
            >
              <Carousel
                ref={carouselRef}
                loop={false}
                inactiveSlideOpacity={0.3}
                shouldOptimizeUpdates
                layout="default"
                vertical={false}
                scrollEnabled={false}
                data={slides}
                renderItem={renderCarouselItem}
                sliderWidth={wp(100)}
                itemWidth={wp(100)}
                inactiveSlideScale={1}
                onSnapToItem={(index) => setCurrentIndex(index)}
              />
              <Box
                flexDirection="row"
                justifyContent="space-between"
                paddingBottom="4xl"
                paddingHorizontal="2xl"
                position="absolute"
                bottom={0}
                left={0}
              >
                <TouchableOpacityBox onPress={onBack}>
                  <BackButton />
                </TouchableOpacityBox>
              </Box>
            </HeliumBottomSheet>
          )}
        </Provider>
      </HotspotBleProvider>
    )
  },
)

const useHotspotOnboarding = (): HotspotOnboardingManager => {
  const context = useContext(HotspotOnboardingContext)
  if (!context) {
    throw new Error(
      'useHotspotOnboarding has to be used within <HotspotOnboardingProvider>',
    )
  }
  return context
}

const OnboardingSheetWrapper = forwardRef((_, ref: Ref<OnboardingSheetRef>) => {
  return (
    <Portal>
      <ThemeProvider theme={lightTheme}>
        <HotspotOnboardingProvider ref={ref} />
      </ThemeProvider>
    </Portal>
  )
})

export {
  useHotspotOnboarding,
  HotspotOnboardingProvider,
  OnboardingSheetWrapper,
}
