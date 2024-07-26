import Box from '@components/Box'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { useColors, useOpacity } from '@theme/themeHooks'
import React, {
  Ref,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { WalletSignBottomSheetSimulated } from './WalletSIgnBottomSheetSimulated'
import { WalletSignBottomSheetCompact } from './WalletSignBottomSheetCompact'
import {
  WalletSignBottomSheetProps,
  WalletSignBottomSheetRef,
  WalletSignOpts,
  WalletStandardMessageTypes,
} from './walletSignBottomSheetTypes'

let promiseResolve: (value: boolean | PromiseLike<boolean>) => void
const WalletSignBottomSheet = forwardRef(
  (
    { onClose, children }: WalletSignBottomSheetProps,
    ref: Ref<WalletSignBottomSheetRef>,
  ) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { secondaryText } = useColors()
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const animatedContentHeight = useSharedValue(0)

    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const [simulated, setSimulated] = useState(false)
    const [walletSignOpts, setWalletSignOpts] = useState<WalletSignOpts>({
      type: WalletStandardMessageTypes.connect,
      url: undefined,
      message: '',
      serializedTxs: undefined,
      header: undefined,
      suppressWarnings: false,
    })

    const hasRenderer = useMemo(
      () => walletSignOpts.renderer !== undefined,
      [walletSignOpts],
    )

    useEffect(() => {
      bottomSheetModalRef.current?.present()
    }, [bottomSheetModalRef])

    const hide = useCallback(() => {
      bottomSheetModalRef.current?.close()
      setSimulated(false)
    }, [])

    const show = useCallback((opts: WalletSignOpts) => {
      bottomSheetModalRef.current?.expand()
      setWalletSignOpts(opts)

      return new Promise<boolean>((resolve) => {
        promiseResolve = resolve
      })
    }, [])

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ),
      [],
    )

    const handleModalDismiss = useCallback(() => {
      if (promiseResolve) {
        promiseResolve(false)
      }
      // We need to re present the bottom sheet after it is dismissed so that it can be expanded again
      bottomSheetModalRef.current?.present()
      if (onClose) {
        onClose()
      }
    }, [onClose])

    const onAcceptHandler = useCallback(() => {
      if (promiseResolve) {
        hide()
        promiseResolve(true)
      }
    }, [hide])

    const onCancelHandler = useCallback(() => {
      if (promiseResolve) {
        hide()
        promiseResolve(false)
      }
    }, [hide])

    return (
      <Box flex={1}>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={-1}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            onDismiss={handleModalDismiss}
            enableDismissOnClose
            handleIndicatorStyle={{
              backgroundColor: secondaryText,
            }}
            // https://ethercreative.github.io/react-native-shadow-generator/
            style={{
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.58,
              shadowRadius: 16.0,
              elevation: 24,
            }}
            enableDynamicSizing
            contentHeight={animatedContentHeight}
          >
            <BottomSheetScrollView>
              {hasRenderer && !simulated ? (
                <WalletSignBottomSheetCompact
                  {...walletSignOpts}
                  onSimulate={() => setSimulated(true)}
                  onAccept={onAcceptHandler}
                  onCancel={onCancelHandler}
                />
              ) : (
                <WalletSignBottomSheetSimulated
                  {...walletSignOpts}
                  onAccept={onAcceptHandler}
                  onCancel={onCancelHandler}
                />
              )}
            </BottomSheetScrollView>
          </BottomSheetModal>
          {children}
        </BottomSheetModalProvider>
      </Box>
    )
  },
)

export default memo(WalletSignBottomSheet)
