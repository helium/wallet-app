import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import CloseButton from '@components/CloseButton'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import useBackHandler from '@hooks/useBackHandler'
import useLedger from '@hooks/useLedger'
import { DeviceModelId } from '@ledgerhq/types-devices'
import { BoxProps } from '@shopify/restyle'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { Theme } from '@theme/theme'
import { useColors, useOpacity } from '@theme/themeHooks'
import SafeAreaBox from '@components/SafeAreaBox'
import { Edge } from 'react-native-safe-area-context'
import {
  signLedgerMessage,
  signLedgerTransaction,
  getDerivationTypeForSigning,
} from '@utils/heliumLedger'
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
import { useTranslation } from 'react-i18next'
import Animation from './Animation'
import LedgerConnectSteps from './LedgerConnectSteps'
import { getDeviceAnimation } from './getDeviceAnimation'

let promiseResolve: (value: Buffer | PromiseLike<Buffer>) => void
let promiseReject: (reason?: Error) => void

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
  ({ children }: Props, ref: Ref<LedgerModalRef | undefined>) => {
    useImperativeHandle(ref, () => ({ showLedgerModal }))

    const { currentAccount } = useAccountStorage()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { setIsShowing } = useBackHandler(bottomSheetModalRef)
    const { secondaryText } = useColors()
    const { t } = useTranslation()
    const { getTransport, openSolanaApp, waitForSolanaApp } = useLedger()
    const [transactionBuffer, setTransactionBuffer] = useState<Buffer>()
    const [messageBuffer, setMessageBuffer] = useState<Buffer>()

    const [ledgerModalState, setLedgerModalState] = useState<
      | 'loading'
      | 'openApp'
      | 'sign'
      | 'enterPinCode'
      | 'error'
      | 'enableBlindSign'
    >('loading')

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

          const p = new Promise<Buffer>((resolve, reject) => {
            promiseResolve = resolve
            promiseReject = reject
          })

          let nextTransport = await getTransport(
            currentAccount.ledgerDevice.id,
            currentAccount.ledgerDevice.type,
          )

          if (!nextTransport) {
            setLedgerModalState('error')
            if (promiseReject) {
              promiseReject(new Error('Failed to get transport for signing'))
            }
            bottomSheetModalRef.current?.dismiss()
            return
          }

          try {
            setLedgerModalState('openApp')
            await openSolanaApp(nextTransport)
            await waitForSolanaApp(nextTransport)
          } catch (error) {
            const ledgerError = error as Error
            switch (ledgerError.message) {
              case 'Ledger device: Locked device (0x5515)':
                setLedgerModalState('enterPinCode')
                return p
              // Happens when solana app already open
              case 'Ledger device: INS_NOT_SUPPORTED (0x6d00)':
                break
              default:
                setLedgerModalState('error')
                break
            }
          }

          setLedgerModalState('sign')

          // Get fresh transport for signing to ensure clean state
          nextTransport = await getTransport(
            currentAccount.ledgerDevice.id,
            currentAccount.ledgerDevice.type,
          )

          if (!nextTransport) {
            setLedgerModalState('error')
            if (promiseReject) {
              promiseReject(new Error('Failed to get transport for signing'))
            }
            bottomSheetModalRef.current?.dismiss()
            return
          }

          let signature

          if (tBuffer) {
            signature = await signLedgerTransaction(
              nextTransport,
              currentAccount.accountIndex,
              tBuffer,
              getDerivationTypeForSigning(currentAccount?.derivationPath),
            )
          } else if (mBuffer) {
            signature = await signLedgerMessage(
              nextTransport,
              currentAccount?.accountIndex,
              mBuffer,
              getDerivationTypeForSigning(currentAccount?.derivationPath),
            )
          }

          bottomSheetModalRef.current?.dismiss()
          return signature
        } catch (error) {
          console.error(error)
          const ledgerError = error as Error
          switch (ledgerError.message) {
            case 'Missing a parameter. Try enabling blind signature in the app':
              setLedgerModalState('enableBlindSign')
              break
            case 'User rejected transaction':
              // Reject promise immediately and dismiss modal
              if (promiseReject) {
                promiseReject(ledgerError)
              }
              bottomSheetModalRef.current?.dismiss()
              return
            case 'Ledger device: Locked device (0x5515)':
              setLedgerModalState('enterPinCode')
              // Don't reject promise - allow retry
              break
            case 'Bluetooth connection was cancelled. Please ensure your Ledger device is unlocked, nearby, and try again.':
              setLedgerModalState('error')
              // Don't reject promise - allow retry for BLE issues
              break
            default:
              // Check for device lock error pattern
              if (
                ledgerError.message.includes('locked') ||
                ledgerError.message.includes('0x5515')
              ) {
                setLedgerModalState('enterPinCode')
                // Don't reject promise - allow retry
              } else if (
                ledgerError.message.includes('Operation was cancelled')
              ) {
                setLedgerModalState('error')
                // Don't reject promise - allow retry for BLE issues
              } else {
                setLedgerModalState('error')
                // Reject the promise with the error for non-retryable errors
                if (promiseReject) {
                  promiseReject(ledgerError)
                }
                bottomSheetModalRef.current?.dismiss()
              }
              break
          }

          // If we reach here, we're in an error state but waiting for user interaction
          // The promise will be resolved/rejected by the retry mechanism
        }
      },
      [
        currentAccount,
        setIsShowing,
        getTransport,
        openSolanaApp,
        waitForSolanaApp,
      ],
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

    const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

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

    const handleRetry = useCallback(async () => {
      try {
        const buffer = await openAppAndSign({
          transactionBuffer,
          messageBuffer,
        })

        if (buffer && promiseResolve) {
          promiseResolve(buffer)
        }
      } catch (error) {
        if (promiseReject) {
          promiseReject(error as Error)
        }
      }
    }, [openAppAndSign, transactionBuffer, messageBuffer])

    const onDismiss = useCallback(() => {
      if (promiseReject) {
        promiseReject(new Error('User closed modal'))
      }
      bottomSheetModalRef.current?.dismiss()
    }, [])

    const LedgerMessage = useCallback(() => {
      switch (ledgerModalState) {
        case 'loading':
          return null
        case 'openApp':
          return (
            <Text variant="h4Medium" color="primaryText">
              {t('ledger.openTheSolanaApp', {
                device: currentAccount?.ledgerDevice?.name,
              })}
            </Text>
          )
        case 'sign':
          return (
            <Text variant="h4Medium" color="primaryText">
              {t('ledger.pleaseConfirmTransaction', {
                device: currentAccount?.ledgerDevice?.name,
              })}
            </Text>
          )
        case 'enterPinCode':
          return (
            <Box>
              <Text variant="h4Medium" color="primaryText">
                {t('ledger.pleaseEnterPinCode', {
                  device: currentAccount?.ledgerDevice?.name,
                })}
              </Text>
              <TouchableOpacityBox
                marginTop="s"
                onPress={handleRetry}
                backgroundColor="surface"
                padding="l"
                borderRadius="round"
              >
                <Text variant="subtitle1" textAlign="center">
                  {t('generic.tryAgain')}
                </Text>
              </TouchableOpacityBox>
            </Box>
          )
        case 'enableBlindSign':
          return (
            <Box>
              <Text variant="h4Medium" color="primaryText">
                {t('ledger.enableBlindSign')}
              </Text>
              <TouchableOpacityBox
                marginTop="s"
                onPress={handleRetry}
                backgroundColor="surface"
                padding="l"
                borderRadius="round"
              >
                <Text variant="subtitle1" textAlign="center">
                  {t('generic.tryAgain')}
                </Text>
              </TouchableOpacityBox>
            </Box>
          )
        case 'error':
          return (
            <Box>
              <Text variant="h4Medium" color="primaryText">
                {t('ledger.transactionRejected')}
              </Text>
              <Text variant="body1Medium" color="secondaryText" marginTop="s">
                {t('ledger.transactionRejectedDescription')}
              </Text>
            </Box>
          )
        default:
          return null
      }
    }, [currentAccount?.ledgerDevice?.name, handleRetry, ledgerModalState, t])

    return (
      <Box flex={1}>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            handleIndicatorStyle={handleIndicatorStyle}
            enableDynamicSizing
          >
            <BottomSheetScrollView>
              <SafeAreaBox edges={safeEdges} paddingHorizontal="l">
                <Box alignItems="flex-end" height={24} justifyContent="center">
                  <CloseButton onPress={onDismiss} />
                </Box>
                {ledgerModalState === 'loading' && (
                  <Box alignItems="center" justifyContent="center" flex={1}>
                    <CircleLoader loaderSize={40} />
                  </Box>
                )}
                {ledgerModalState !== 'loading' &&
                  ledgerModalState !== 'error' && (
                    <>
                      <Box
                        alignSelf="stretch"
                        alignItems="center"
                        justifyContent="center"
                        minHeight={120}
                      >
                        <Animation
                          source={getDeviceAnimation({
                            device: {
                              deviceId: currentAccount?.ledgerDevice?.id ?? '',
                              deviceName:
                                currentAccount?.ledgerDevice?.name ?? '',
                              modelId: deviceModelId,
                              wired:
                                currentAccount?.ledgerDevice?.type === 'usb',
                            },
                            key: ledgerModalState,
                            theme: 'dark',
                          })}
                          style={
                            deviceModelId === DeviceModelId.stax
                              ? { height: 210 }
                              : { height: 120 }
                          }
                        />
                      </Box>
                      <Box>{LedgerMessage()}</Box>
                    </>
                  )}
                {ledgerModalState === 'error' && (
                  <Box marginBottom="l">
                    <LedgerConnectSteps onRetry={handleRetry} />
                  </Box>
                )}
              </SafeAreaBox>
            </BottomSheetScrollView>
          </BottomSheetModal>
          {children}
        </BottomSheetModalProvider>
      </Box>
    )
  },
)

export default memo(LedgerModal)
