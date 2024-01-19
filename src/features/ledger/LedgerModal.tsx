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
import { signLedgerMessage, signLedgerTransaction } from '@utils/heliumLedger'
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
import { useSharedValue } from 'react-native-reanimated'
import Animation from './Animation'
import LedgerConnectSteps from './LedgerConnectSteps'
import { getDeviceAnimation } from './getDeviceAnimation'

let promiseResolve: (value: Buffer | PromiseLike<Buffer>) => void

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
    const { getTransport, openSolanaApp } = useLedger()
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

    const animatedContentHeight = useSharedValue(0)

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

          const p = new Promise<Buffer>((resolve) => {
            promiseResolve = resolve
          })

          let nextTransport = await getTransport(
            currentAccount.ledgerDevice.id,
            currentAccount.ledgerDevice.type,
          )

          if (!nextTransport) {
            setLedgerModalState('error')
            // eslint-disable-next-line @typescript-eslint/return-await
            return p
          }

          try {
            setLedgerModalState('openApp')
            await openSolanaApp(nextTransport)
            // wait 1 second ledger to open solana app
            await new Promise((resolve) => setTimeout(resolve, 1000))
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

          nextTransport = await getTransport(
            currentAccount.ledgerDevice.id,
            currentAccount.ledgerDevice.type,
          )

          if (!nextTransport) {
            setLedgerModalState('error')
            // eslint-disable-next-line @typescript-eslint/return-await
            return p
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
          console.error(error)
          const ledgerError = error as Error
          switch (ledgerError.message) {
            case 'Missing a parameter. Try enabling blind signature in the app':
              setLedgerModalState('enableBlindSign')
              break
            default:
              setLedgerModalState('error')
          }

          const p = new Promise<Buffer>((resolve) => {
            promiseResolve = resolve
          })
          return p
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

    const handleRetry = useCallback(async () => {
      const buffer = await openAppAndSign({
        transactionBuffer,
        messageBuffer,
      })

      if (buffer) {
        promiseResolve(buffer)
      }
    }, [openAppAndSign, transactionBuffer, messageBuffer])

    const onDismiss = useCallback(() => {
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
          return null
        default:
          return null
      }
    }, [currentAccount?.ledgerDevice?.name, handleRetry, ledgerModalState, t])

    return (
      <Box flex={1}>
        <BottomSheetModalProvider>
          {/* <Box flex={1} {...boxProps}> */}
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            // onDismiss={handleModalDismiss}
            handleIndicatorStyle={handleIndicatorStyle}
            contentHeight={animatedContentHeight}
            enableDynamicSizing
          >
            <BottomSheetScrollView>
              <Box paddingHorizontal="l">
                <Box flex={1} alignItems="flex-end">
                  <CloseButton onPress={onDismiss} />
                </Box>
                {ledgerModalState === 'loading' && (
                  <Box>
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
                        height={150}
                      >
                        <Animation
                          source={getDeviceAnimation({
                            device: {
                              deviceId: currentAccount?.ledgerDevice?.id ?? '',
                              deviceName:
                                currentAccount?.ledgerDevice?.name ?? '',
                              modelId: deviceModelId,
                              wired:
                                currentAccount?.ledgerDevice?.type === 'usb' ??
                                false,
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
                      {LedgerMessage()}
                    </>
                  )}
                {ledgerModalState === 'error' && (
                  <LedgerConnectSteps onRetry={handleRetry} />
                )}
              </Box>
            </BottomSheetScrollView>
          </BottomSheetModal>
          {children}
          {/* </Box> */}
        </BottomSheetModalProvider>
      </Box>
    )
  },
)

export default memo(LedgerModal)
