import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import useBackHandler from '@hooks/useBackHandler'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { useColors, useOpacity } from '@theme/themeHooks'
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
import Box from '@components/Box'
import { DeviceModelId } from '@ledgerhq/types-devices'
import Text from '@components/Text'
import { useTranslation } from 'react-i18next'
import { signLedgerMessage, signLedgerTransaction } from '@utils/heliumLedger'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import useLedger from '@hooks/useLedger'
import CircleLoader from '@components/CircleLoader'
import LedgerConnectSteps from './LedgerConnectSteps'
import Animation from './Animation'
import { getDeviceAnimation } from './getDeviceAnimation'

export type LedgerModalRef = {
  showLedgerModal: ({
    transaction,
  }: {
    transaction?: Buffer
    message?: Buffer
  }) => Promise<Buffer | undefined>
}

type Props = {
  children: ReactNode
} & BoxProps<Theme>
const LedgerModal = forwardRef(
  ({ children, ...boxProps }: Props, ref: Ref<LedgerModalRef | undefined>) => {
    useImperativeHandle(ref, () => ({ showLedgerModal }))

    const { currentAccount } = useAccountStorage()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { setIsShowing } = useBackHandler(bottomSheetModalRef)
    const { secondaryText } = useColors()
    const { t } = useTranslation()
    const { getTransport, openSolanaApp } = useLedger()
    const [transactionBuffer, setTransactionBuffer] = useState<Buffer>()
    const [messageBuffer, setMessageBuffer] = useState<Buffer>()

    const [ledgerModalState, setLedgerModalState] = useState<
      'loading' | 'openApp' | 'sign' | 'error'
    >('loading')

    const snapPoints = useMemo(() => ['25%', 'CONTENT_HEIGHT'], [])

    const {
      animatedHandleHeight,
      animatedSnapPoints,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(snapPoints)

    const openAppAndSign = useCallback(
      async ({
        transactionBuffer: tBuffer,
        messageBuffer: mBuffer,
      }: {
        transactionBuffer?: Buffer
        messageBuffer?: Buffer
      }) => {
        if (
          (!tBuffer && !mBuffer) ||
          !currentAccount?.ledgerDevice?.id ||
          !currentAccount?.ledgerDevice?.type ||
          currentAccount?.accountIndex === undefined
        ) {
          return
        }

        try {
          setLedgerModalState('loading')
          bottomSheetModalRef.current?.present()
          setIsShowing(true)

          let nextTransport = await getTransport(
            currentAccount.ledgerDevice.id,
            currentAccount.ledgerDevice.type,
          )

          if (!nextTransport) {
            setLedgerModalState('error')
            return
          }

          try {
            setLedgerModalState('openApp')
            await openSolanaApp(nextTransport)
          } catch {
            // ignore
          }

          setLedgerModalState('sign')

          // wait 2 seconds for user to open Solana app
          await new Promise((resolve) => setTimeout(resolve, 2000))

          nextTransport = await getTransport(
            currentAccount.ledgerDevice.id,
            currentAccount.ledgerDevice.type,
          )

          if (!nextTransport) {
            setLedgerModalState('error')
            return
          }

          let signature

          if (tBuffer) {
            signature = await signLedgerTransaction(
              nextTransport,
              currentAccount.accountIndex,
              tBuffer,
            )
          } else if (mBuffer) {
            signature = await signLedgerMessage(
              nextTransport,
              currentAccount?.accountIndex,
              mBuffer,
            )
          }

          bottomSheetModalRef.current?.dismiss()
          return signature
        } catch (error) {
          setLedgerModalState('error')
        }
      },
      [currentAccount, setIsShowing, getTransport, openSolanaApp],
    )

    const showLedgerModal = useCallback(
      async ({
        transaction,
        message,
      }: {
        transaction?: Buffer
        message?: Buffer
      }) => {
        if (transaction) {
          setTransactionBuffer(transaction)
        }
        if (message) {
          setMessageBuffer(message)
        }
        return openAppAndSign({
          transactionBuffer: transaction,
          messageBuffer: message,
        })
      },
      [openAppAndSign],
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

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: secondaryText,
      }
    }, [secondaryText])

    const deviceModelId = useMemo(() => {
      let model = DeviceModelId.nanoX

      if (!currentAccount?.ledgerDevice?.name) {
        return model
      }

      if (currentAccount?.ledgerDevice?.name.toLowerCase().includes('nano s')) {
        model = DeviceModelId.nanoS
      } else if (
        currentAccount?.ledgerDevice?.name.toLowerCase().includes('nano x')
      ) {
        model = DeviceModelId.nanoX
      } else if (
        currentAccount?.ledgerDevice?.name.toLowerCase().includes('stax')
      ) {
        model = DeviceModelId.stax
      } else if (
        currentAccount?.ledgerDevice?.name.toLowerCase().includes('blue')
      ) {
        model = DeviceModelId.blue
      } else if (
        currentAccount?.ledgerDevice?.name.toLowerCase().includes('nano sp')
      ) {
        model = DeviceModelId.nanoSP
      }

      return model
    }, [currentAccount?.ledgerDevice?.name])

    const handleRetry = useCallback(() => {
      openAppAndSign({
        transactionBuffer,
        messageBuffer,
      })
    }, [openAppAndSign, transactionBuffer, messageBuffer])

    return (
      <BottomSheetModalProvider>
        <Box flex={1} {...boxProps}>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            snapPoints={animatedSnapPoints.value}
            // onDismiss={handleModalDismiss}
            handleIndicatorStyle={handleIndicatorStyle}
            handleHeight={animatedHandleHeight}
            contentHeight={animatedContentHeight}
          >
            <Box paddingHorizontal="l" onLayout={handleContentLayout}>
              {ledgerModalState === 'loading' && (
                <Box>
                  <CircleLoader loaderSize={40} />
                </Box>
              )}
              {(ledgerModalState === 'sign' ||
                ledgerModalState === 'openApp') && (
                <>
                  <Box
                    alignSelf="stretch"
                    alignItems="center"
                    justifyContent="center"
                    height={150}
                  >
                    <Animation
                      source={getDeviceAnimation({
                        device: {
                          deviceId: currentAccount?.ledgerDevice?.id || '',
                          deviceName: currentAccount?.ledgerDevice?.name || '',
                          modelId: deviceModelId,
                          wired: currentAccount?.ledgerDevice?.type === 'usb',
                        },
                        key: ledgerModalState,
                        theme: 'dark',
                      })}
                      style={
                        deviceModelId === DeviceModelId.stax
                          ? { height: 210 }
                          : {}
                      }
                    />
                  </Box>
                  <Text variant="h4Medium" color="primaryText">
                    {t(
                      ledgerModalState === 'sign'
                        ? 'ledger.pleaseConfirmTransaction'
                        : 'ledger.openTheSolanaApp',
                      {
                        device: currentAccount?.ledgerDevice?.name,
                      },
                    )}
                  </Text>
                </>
              )}
              {ledgerModalState === 'error' && (
                <LedgerConnectSteps onRetry={handleRetry} />
              )}
            </Box>
          </BottomSheetModal>
          {children}
        </Box>
      </BottomSheetModalProvider>
    )
  },
)

export default memo(LedgerModal)
