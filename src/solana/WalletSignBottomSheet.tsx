import Box from '@components/Box'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { useBorderRadii } from '@theme/themeHooks'
import React, {
  Ref,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ThemeProvider } from '@shopify/restyle'
import { darkTheme } from '@theme/theme'
import { StyleProp, ViewStyle } from 'react-native'
import {
  WalletSignBottomSheetProps,
  WalletSignBottomSheetRef,
  WalletSignOpts,
  WalletStandardMessageTypes,
} from './walletSignBottomSheetTypes'
import { WalletSignBottomSheetCompact } from './WalletSignBottomSheetCompact'
import { WalletSignBottomSheetSimulated } from './WalletSIgnBottomSheetSimulated'

const WalletSignBottomSheet = forwardRef(
  (
    { onClose, children }: WalletSignBottomSheetProps,
    ref: Ref<WalletSignBottomSheetRef>,
  ) => {
    const [promiseResolve, setPromiseResolve] = useState<
      ((value: boolean | PromiseLike<boolean>) => void) | null
    >(null)
    useImperativeHandle(ref, () => ({ show, hide }))
    const borderRadii = useBorderRadii()
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
      bottomSheetModalRef.current?.present()
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

    const handleIndicatorStyle = useMemo(() => {
      return {
        width: 90,
        height: 4,
        backgroundColor: darkTheme.colors.secondaryText,
      }
    }, [])

    const handleStyle = useMemo(
      () =>
        ({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
        } as StyleProp<ViewStyle>),
      [],
    )

    return (
      <Box flex={1}>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={{
              backgroundColor: darkTheme.colors.primaryBackground,
              borderRadius: borderRadii['4xl'] + borderRadii['4xl'],
            }}
            backdropComponent={renderBackdrop}
            onDismiss={handleModalDismiss}
            enableDismissOnClose
            handleStyle={handleStyle}
            handleIndicatorStyle={handleIndicatorStyle}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.58,
              shadowRadius: 16.0,
              elevation: 24,
            }}
            enableDynamicSizing
          >
            <ThemeProvider theme={darkTheme}>
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
            </ThemeProvider>
          </BottomSheetModal>
          {children}
        </BottomSheetModalProvider>
      </Box>
    )
  },
)

const WalletSignBottomSheetWrapper = forwardRef(
  (
    { onClose, children }: WalletSignBottomSheetProps,
    ref: Ref<WalletSignBottomSheetRef>,
  ) => {
    return (
      <WalletSignBottomSheet ref={ref} onClose={onClose}>
        {children}
      </WalletSignBottomSheet>
    )
  },
)

export default memo(WalletSignBottomSheetWrapper)
