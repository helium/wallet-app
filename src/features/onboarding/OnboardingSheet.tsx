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
import { Portal } from '@gorhom/portal'
import { ThemeProvider } from '@shopify/restyle'
import { lightTheme } from '@config/theme/theme'
import DeviceScan from '@features/ledger/DeviceScan'
import DeviceChooseType from '@features/ledger/DeviceChooseType'
import DeviceShow from '@features/ledger/DeviceShow'
import PairSuccess from '@features/ledger/PairSuccess'
import ScanQrCodeScreen from '@features/keystone/ScanQrCodeScreen'
import SelectKeystoneAccountsScreen from '@features/keystone/SelectKeystoneAccountsScreen'
import KeystoneAccountAssignScreen from '@features/keystone/KeystoneAccountAssignScreen'
import AccountImportScreen from './import/AccountImportScreen'
import ImportSubAccountsScreen from './import/ImportSubAccountsScreen'
import { useOnboarding } from './OnboardingProvider'
import AccountAssignScreen from './AccountAssignScreen'
import ImportPrivateKey from './import/ImportPrivateKey'
import CLIAccountImportStartScreen from './cli-import/CLIAccountImportStartScreen'
import CLIQrScanner from './cli-import/CLIQrScanner'
import CLIPasswordScreen from './cli-import/CLIPasswordScreen'
import AccountCreatePassphraseScreen from './create/AccountCreatePassphraseScreen'
import AccountEnterPassphraseScreen from './create/AccountEnterPassphraseScreen'

export type FlowType =
  | 'secret-phrase'
  | 'private-key'
  | 'command-line'
  | 'sub-wallet'
  | 'create-account'
  | 'ledger'
  | 'keystone'

export type OnboardingSheetRef = {
  show: (type: FlowType) => void
  hide: () => void
}

type CarouselItem = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Screen: (ScreenProps) => React.JSX.Element
}

type OnboardingSheet = {
  carouselRef: RefObject<Carousel<CarouselItem>> | null
  flowType: FlowType
  setFlowType: (flowType: FlowType) => void
}

const useOnboardingSheetHook = (): OnboardingSheet => {
  const [flowType, setFlowType] = useState<FlowType>('secret-phrase')
  return {
    carouselRef: null,
    flowType,
    setFlowType,
  }
}

export type OnboardingSheetManager = ReturnType<typeof useOnboardingSheetHook>

const OnboardingSheetContext = createContext<OnboardingSheetManager | null>(
  null,
)

const { Provider } = OnboardingSheetContext

const OnboardingSheetProvider = forwardRef(
  (_, ref: Ref<OnboardingSheetRef>) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const [visible, setVisible] = useState(false)
    const { reset } = useOnboarding()

    const hookValues = useOnboardingSheetHook()
    const bottomSheetRef = useRef<BottomSheet>(null)
    const carouselRef = useRef<Carousel<CarouselItem>>(null)
    const { top } = useSafeAreaInsets()
    const spacing = useSpacing()
    const dispatch = useAppDispatch()
    const [currentIndex, setCurrentIndex] = useState(0)

    const show = useCallback(
      (flowType: FlowType) => {
        hookValues.setFlowType(flowType)
        setVisible(true)
      },
      [hookValues],
    )

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
      const pages: CarouselItem[] = []

      if (hookValues.flowType === 'sub-wallet') {
        pages.push({
          Screen: AccountAssignScreen,
        })
      }

      if (hookValues.flowType === 'command-line') {
        pages.push(
          {
            Screen: CLIAccountImportStartScreen,
          },
          {
            Screen: CLIQrScanner,
          },
          {
            Screen: CLIPasswordScreen,
          },
          {
            Screen: AccountAssignScreen,
          },
        )
      }

      if (hookValues.flowType === 'secret-phrase') {
        pages.push(
          ...[
            {
              Screen: AccountImportScreen,
            },
            {
              Screen: ImportSubAccountsScreen,
            },
            {
              Screen: AccountAssignScreen,
            },
          ],
        )
      }

      if (hookValues.flowType === 'private-key') {
        pages.push(
          ...[
            {
              Screen: ImportPrivateKey,
            },
            {
              Screen: ImportSubAccountsScreen,
            },
            {
              Screen: AccountAssignScreen,
            },
          ],
        )
      }

      if (hookValues.flowType === 'create-account') {
        pages.push(
          {
            Screen: AccountCreatePassphraseScreen,
          },
          {
            Screen: AccountEnterPassphraseScreen,
          },
          {
            Screen: AccountAssignScreen,
          },
        )
      }

      if (hookValues.flowType === 'ledger') {
        if (Platform.OS === 'android') {
          pages.push(
            ...[
              {
                Screen: DeviceChooseType,
              },
            ],
          )
        }

        pages.push(
          ...[
            {
              Screen: DeviceScan,
            },
            {
              Screen: DeviceShow,
            },
            {
              Screen: PairSuccess,
            },
          ],
        )
      }

      if (hookValues.flowType === 'keystone') {
        pages.push(
          ...[
            {
              Screen: ScanQrCodeScreen,
            },
            {
              Screen: SelectKeystoneAccountsScreen,
            },
            {
              Screen: KeystoneAccountAssignScreen,
            },
          ],
        )
      }

      return pages
    }, [hookValues?.flowType])

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

    const onClose = useCallback(() => {
      reset()
    }, [reset])

    return (
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
            onClose={onClose}
            showBackdrop
          >
            <Box flex={1}>
              <Carousel
                ref={carouselRef}
                loop={false}
                inactiveSlideOpacity={0.3}
                shouldOptimizeUpdates
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
            </Box>
          </HeliumBottomSheet>
        )}
      </Provider>
    )
  },
)

const useOnboardingSheet = (): OnboardingSheetManager => {
  const context = useContext(OnboardingSheetContext)
  if (!context) {
    throw new Error(
      'useOnboardingSheet has to be used within <OnboardingSheetProvider>',
    )
  }
  return context
}

const OnboardingSheetWrapper = forwardRef((_, ref: Ref<OnboardingSheetRef>) => {
  return (
    <Portal>
      <ThemeProvider theme={lightTheme}>
        <OnboardingSheetProvider ref={ref} />
      </ThemeProvider>
    </Portal>
  )
})

export { useOnboardingSheet, OnboardingSheetProvider, OnboardingSheetWrapper }
