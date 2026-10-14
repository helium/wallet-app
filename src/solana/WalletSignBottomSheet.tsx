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
import { createSignRequestResolver } from './signRequestResolver'
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
    // A ref, not state: context callers hold a stale show(), so settling
    // the pending request must not depend on a re-render
    const signRequestRef = useRef(createSignRequestResolver())
    useImperativeHandle(ref, () => ({ show, hide }))
    const { secondaryText } = useColors()
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)

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
      const decision = signRequestRef.current.next()
      bottomSheetModalRef.current?.present()
      bottomSheetModalRef.current?.expand()
      setWalletSignOpts(opts)
      bottomSheetModalRef.current?.snapToIndex(0)
      return decision
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
      signRequestRef.current.settle(false)
      if (onClose) {
        onClose()
      }
    }, [onClose])

    const onAcceptHandler = useCallback(() => {
      if (signRequestRef.current.settle(true)) hide()
    }, [hide])

    const onCancelHandler = useCallback(() => {
      if (signRequestRef.current.settle(false)) hide()
    }, [hide])

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
