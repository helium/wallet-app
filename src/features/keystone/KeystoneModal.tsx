import Box from '@components/Box'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import useBackHandler from '@hooks/useBackHandler'
import { useTheme } from '@shopify/restyle'
import { useOpacity, useSpacing } from '@theme/themeHooks'
import React, {
  ReactNode,
  Ref,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
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

let promiseResolve: (value: Buffer | PromiseLike<Buffer>) => void
const KeystoneModal = forwardRef(
  (
    { children }: { children: ReactNode },
    ref: Ref<KeystoneModalRef | undefined>,
  ) => {
    useImperativeHandle(ref, () => ({ showKeystoneModal }))
    const eventEmitter = useMemo(() => new EventEmitter(), [])
    const { currentAccount } = useAccountStorage()
    const { backgroundStyle } = useOpacity('primaryBackground', 1)
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const [solSignRequest, setSolSignRequest] =
      useState<KeystoneSolSignRequest>()
    const showKeystoneModal = useCallback(
      async ({
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
            dataType: KeystoneSolanaSDK.DataType.Message,
            path: currentAccount?.derivationPath || '',
            xfp: currentAccount?.keystoneDevice?.masterFingerprint || '',
            chainId: 1,
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
            chainId: 1,
            origin: 'Helium',
          })
        }
        const keystonePromise = new Promise<Buffer | undefined>((resolve) => {
          promiseResolve = resolve
        })
        // listen the keystone signature event
        eventEmitter.on(`keystoneSignature_${requestId}`, (signature) => {
          bottomSheetModalRef.current?.dismiss()
          promiseResolve(Buffer.from(signature, 'hex'))
        })

        eventEmitter.on('closeKeystoneSignatureModal', () => {
          bottomSheetModalRef.current?.dismiss()
          promiseResolve(Buffer.from([]))
        })
        return keystonePromise
      },
      [
        eventEmitter,
        currentAccount?.derivationPath,
        currentAccount?.keystoneDevice?.masterFingerprint,
      ],
    )
    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          {...props}
        />
      ),
      [],
    )
    const snapPoints = useMemo(() => ['100%'], [])
    const { xl } = useSpacing()
    const { colors } = useTheme()
    const sheetHandleStyle = useMemo(() => ({ padding: xl }), [xl])
    const { handleDismiss } = useBackHandler(bottomSheetModalRef)

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: colors.secondaryText,
      }
    }, [colors.secondaryText])
    return (
      <Box flex={1} backgroundColor="blue.950">
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            snapPoints={snapPoints}
            handleStyle={sheetHandleStyle}
            onDismiss={handleDismiss}
            handleIndicatorStyle={handleIndicatorStyle}
          >
            <SignTxModal
              eventEmitter={eventEmitter}
              solSignRequest={solSignRequest as KeystoneSolSignRequest}
            />
          </BottomSheetModal>
          {children}
        </BottomSheetModalProvider>
      </Box>
    )
  },
)

export default memo(KeystoneModal)
