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
  useImperativeHandle,
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

const WalletSignBottomSheet = forwardRef(
  (
    { onClose, children }: WalletSignBottomSheetProps,
    ref: Ref<WalletSignBottomSheetRef>,
  ) => {
    const [promiseResolve, setPromiseResolve] = useState<
      ((value: boolean | PromiseLike<boolean>) => void) | null
    >(null)
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

    const hasRenderer = walletSignOpts.renderer !== undefined
    const hide = useCallback(() => {
      bottomSheetModalRef.current?.close()
      setSimulated(false)
    }, [])

    const show = useCallback((opts: WalletSignOpts) => {
      bottomSheetModalRef.current?.present() // Move the present() call here
      bottomSheetModalRef.current?.expand()
      setWalletSignOpts(opts)

      return new Promise<boolean>((resolve) => {
        setPromiseResolve(() => resolve)
        bottomSheetModalRef.current?.snapToIndex(0)
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
      if (onClose) {
        onClose()
      }
    }, [onClose, promiseResolve])

    const onAcceptHandler = useCallback(() => {
      if (promiseResolve) {
        hide()
        promiseResolve(true)
      }
    }, [hide, promiseResolve])

    const onCancelHandler = useCallback(() => {
      if (promiseResolve) {
        hide()
        promiseResolve(false)
      }
    }, [hide, promiseResolve])

    return (
      <Box flex={1}>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            onDismiss={handleModalDismiss}
            enableDismissOnClose
            handleIndicatorStyle={{ backgroundColor: secondaryText }}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
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
