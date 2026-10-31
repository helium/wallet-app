import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import useBackHandler from '@hooks/useBackHandler'
import React, {
  ReactNode,
  Ref,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { View } from 'react-native'
import { useResolveClassNames } from 'uniwind'
import { useSheetMargins } from '@components/ContentColumn'
import EventEmitter from 'events'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { KeystoneSolanaSDK } from '@keystonehq/keystone-sdk'
import { uuid } from '@keystonehq/keystone-sdk/dist/utils'
import SignTxModal from './SignTx/SignTxModal'
import { KeystoneSolSignRequest } from './types/keystoneSolanaTxType'

export type KeystoneModalRef = {
  showKeystoneModal: ({
    transaction,
  }: {
    transaction?: Buffer
    message?: Buffer
  }) => Promise<Buffer | undefined>
}

const SNAP_POINTS = ['100%']

const KeystoneModal = ({
  children,
  ref,
}: {
  children: ReactNode
  ref?: Ref<KeystoneModalRef | undefined>
}) => {
  const eventEmitter = useMemo(() => new EventEmitter(), [])
  const { currentAccount } = useAccountStorage()
  const backgroundStyle = useResolveClassNames('bg-secondary')
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const sheetMargins = useSheetMargins()
  const settleRef = useRef<((value: Buffer) => void) | undefined>(undefined)
  const [solSignRequest, setSolSignRequest] = useState<KeystoneSolSignRequest>()
  const showKeystoneModal = async ({
    transaction,
    message,
  }: {
    transaction?: Buffer
    message?: Buffer
  }): Promise<Buffer | undefined> => {
    const requestId = uuid.v4()
    // why need setTimeout? modal mounted --> sleep 1s --> modal present
    setTimeout(() => {
      bottomSheetModalRef.current?.present()
    }, 1000)
    if (transaction) {
      setSolSignRequest({
        requestId,
        signData: transaction.toString('hex'),
        dataType: KeystoneSolanaSDK.DataType.Transaction,
        path: currentAccount?.derivationPath || '',
        xfp: currentAccount?.keystoneDevice?.masterFingerprint || '',
        origin: 'Helium',
      })
    }
    if (message) {
      setSolSignRequest({
        requestId,
        signData: message.toString('hex'),
        dataType: KeystoneSolanaSDK.DataType.Message,
        path: currentAccount?.derivationPath || '',
        xfp: currentAccount?.keystoneDevice?.masterFingerprint as string,
        origin: 'Helium',
      })
    }
    let promiseResolve: (value: Buffer) => void = () => {}
    const keystonePromise = new Promise<Buffer | undefined>((resolve) => {
      promiseResolve = resolve
    })
    // Listeners are removed on settle so repeated sign requests in one
    // session do not stack handlers.
    const onSignature = (signature: string) => {
      settle(Buffer.from(signature, 'hex'))
    }
    const onClose = () => {
      settle(Buffer.from([]))
    }
    const settle = (value: Buffer) => {
      eventEmitter.off(`keystoneSignature_${requestId}`, onSignature)
      eventEmitter.off('closeKeystoneSignatureModal', onClose)
      settleRef.current = undefined
      bottomSheetModalRef.current?.dismiss()
      promiseResolve(value)
    }
    settleRef.current = settle
    eventEmitter.on(`keystoneSignature_${requestId}`, onSignature)
    eventEmitter.on('closeKeystoneSignatureModal', onClose)
    return keystonePromise
  }
  useImperativeHandle(ref, () => ({ showKeystoneModal }))
  const renderBackdrop = (props) => (
    <BottomSheetBackdrop disappearsOnIndex={-1} appearsOnIndex={0} {...props} />
  )
  const sheetHandleStyle = useResolveClassNames('p-4')
  const { handleDismiss } = useBackHandler(bottomSheetModalRef)
  // Backdrop tap, swipe down and back button dismiss the sheet without an
  // event, so the pending sign request has to be settled here.
  const handleSheetDismiss = () => {
    settleRef.current?.(Buffer.from([]))
    handleDismiss()
  }

  const handleIndicatorStyle = useResolveClassNames('bg-muted-foreground')
  return (
    <View className="flex-1 bg-background">
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          style={sheetMargins}
          index={0}
          enableDynamicSizing={false}
          backgroundStyle={backgroundStyle}
          backdropComponent={renderBackdrop}
          snapPoints={SNAP_POINTS}
          handleStyle={sheetHandleStyle}
          onDismiss={handleSheetDismiss}
          handleIndicatorStyle={handleIndicatorStyle}
        >
          <BottomSheetView className="flex-1">
            <SignTxModal
              eventEmitter={eventEmitter}
              solSignRequest={solSignRequest as KeystoneSolSignRequest}
            />
          </BottomSheetView>
        </BottomSheetModal>
        {children}
      </BottomSheetModalProvider>
    </View>
  )
}

export default KeystoneModal
