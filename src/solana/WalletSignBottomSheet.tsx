import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import React, { Ref, useImperativeHandle, useRef, useState } from 'react'
import { View } from 'react-native'
import { useResolveClassNames } from 'uniwind'
import { useSheetMargins } from '@ui/ContentColumn'
import { createSignRequestResolver } from './signRequestResolver'
import { WalletSignBottomSheetSimulated } from './WalletSIgnBottomSheetSimulated'
import { WalletSignBottomSheetCompact } from './WalletSignBottomSheetCompact'
import {
  WalletSignBottomSheetProps,
  WalletSignBottomSheetRef,
  WalletSignOpts,
  WalletStandardMessageTypes,
} from './walletSignBottomSheetTypes'

const SheetBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop disappearsOnIndex={-1} appearsOnIndex={0} {...props} />
)

const WalletSignBottomSheet = ({
  ref,
  onClose,
  children,
}: WalletSignBottomSheetProps & { ref?: Ref<WalletSignBottomSheetRef> }) => {
  // A ref, not state: context callers hold a stale show(), so settling
  // the pending request must not depend on a re-render
  const signRequestRef = useRef(createSignRequestResolver())
  // A request that supersedes an open one waits here while the old sheet
  // closes, so the user never approves it on a sheet that swapped in place
  const supersedingOptsRef = useRef<WalletSignOpts | null>(null)
  // World's phone tray (style guide §9.5), as src/ui/Sheet draws it
  const backgroundStyle = useResolveClassNames('rounded-t-3xl bg-popover')
  const handleIndicatorStyle = useResolveClassNames(
    'h-1 w-9 rounded-full bg-foreground/20',
  )

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const sheetMargins = useSheetMargins()
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
  const hide = () => {
    bottomSheetModalRef.current?.close()
    setSimulated(false)
  }

  const present = (opts: WalletSignOpts) => {
    bottomSheetModalRef.current?.present()
    bottomSheetModalRef.current?.expand()
    setWalletSignOpts(opts)
    bottomSheetModalRef.current?.snapToIndex(0)
  }

  const show = (opts: WalletSignOpts) => {
    const superseding = signRequestRef.current.isPending()
    const decision = signRequestRef.current.next()
    if (superseding) {
      // Staged before hide(): the dismiss presents it in a fresh sheet
      supersedingOptsRef.current = opts
      hide()
    } else {
      present(opts)
    }
    return decision
  }

  useImperativeHandle(ref, () => ({ show, hide }))

  const handleModalDismiss = () => {
    const supersedingOpts = supersedingOptsRef.current
    if (supersedingOpts) {
      supersedingOptsRef.current = null
      present(supersedingOpts)
      return
    }
    signRequestRef.current.settle(false)
    if (onClose) {
      onClose()
    }
  }

  // The closing sheet still shows the superseded request's buttons
  const onAcceptHandler = () => {
    if (supersedingOptsRef.current) return
    if (signRequestRef.current.settle(true)) hide()
  }

  const onCancelHandler = () => {
    if (supersedingOptsRef.current) return
    if (signRequestRef.current.settle(false)) hide()
  }

  return (
    <View className="flex-1">
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          backgroundStyle={backgroundStyle}
          backdropComponent={SheetBackdrop}
          onDismiss={handleModalDismiss}
          enableDismissOnClose
          handleIndicatorStyle={handleIndicatorStyle}
          style={sheetMargins}
          enableDynamicSizing
        >
          <BottomSheetScrollView contentInsetAdjustmentBehavior="automatic">
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
    </View>
  )
}

export default WalletSignBottomSheet
