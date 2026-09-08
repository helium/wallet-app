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
  classifyLedgerError,
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

// One signing session per showLedgerModal call. Retries reuse the same
// session so the caller's promise always settles exactly once.
type SigningSession = {
  transaction?: Buffer
  message?: Buffer
  settled: boolean
  resolve: (value: Buffer) => void
  reject: (reason: Error) => void
}

type LedgerModalState =
  | 'loading'
  | 'openApp'
  | 'sign'
  | 'enterPinCode'
  | 'error'
  | 'enableBlindSign'
  | 'failed'

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
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
    const { secondaryText } = useColors()
    const { t } = useTranslation()
    const {
      getTransport,
      openSolanaApp,
      reconnectAfterAppOpen,
      waitForSolanaApp,
    } = useLedger()
    const sessionRef = useRef<SigningSession | undefined>(undefined)
    // Session whose settle triggered our own dismiss(). onDismiss fires after
    // the close animation, by which time the caller may have started the next
    // session, which must not be rejected.
    const settledSessionRef = useRef<SigningSession | undefined>(undefined)
    const [failureMessage, setFailureMessage] = useState<string>()

    const [ledgerModalState, setLedgerModalState] =
      useState<LedgerModalState>('loading')

    const runSigningSession = useCallback(
      async (session: SigningSession) => {
        if (
          !currentAccount?.ledgerDevice?.id ||
          !currentAccount?.ledgerDevice?.type ||
          currentAccount?.accountIndex === undefined
        ) {
          session.reject(new Error('Ledger account is not configured'))
          return
        }
        const { id: deviceId, type: deviceType } = currentAccount.ledgerDevice

        try {
          setLedgerModalState('loading')
          bottomSheetModalRef.current?.present()
          setIsShowing(true)

          let transport = await getTransport(deviceId, deviceType)
          if (!transport) {
            setLedgerModalState('error')
            return
          }

          setLedgerModalState('openApp')
          let appAlreadyOpen = false
          try {
            await openSolanaApp(transport)
          } catch (error) {
            if (classifyLedgerError(error) !== 'appNotOpen') {
              throw error
            }
            // 0x6d00 / 0x6e00 here means the Solana app answered: it is open
            appAlreadyOpen = true
          }

          if (appAlreadyOpen) {
            await waitForSolanaApp(transport)
          } else {
            transport = await reconnectAfterAppOpen(
              transport,
              deviceId,
              deviceType,
            )
          }

          setLedgerModalState('sign')

          const derivationType = getDerivationTypeForSigning(
            currentAccount.derivationPath,
          )
          const signature = session.transaction
            ? await signLedgerTransaction(
                transport,
                currentAccount.accountIndex,
                session.transaction,
                derivationType,
              )
            : await signLedgerMessage(
                transport,
                currentAccount.accountIndex,
                session.message as Buffer,
                derivationType,
              )

          session.resolve(signature)
          settledSessionRef.current = session
          bottomSheetModalRef.current?.dismiss()
        } catch (error) {
          console.error(error)
          switch (classifyLedgerError(error)) {
            case 'userRejected':
              session.reject(error as Error)
              settledSessionRef.current = session
              bottomSheetModalRef.current?.dismiss()
              break
            case 'locked':
              setLedgerModalState('enterPinCode')
              break
            case 'blindSign':
              setLedgerModalState('enableBlindSign')
              break
            case 'transport':
              setLedgerModalState('error')
              break
            default:
              setFailureMessage(
                error instanceof Error ? error.message : String(error),
              )
              setLedgerModalState('failed')
          }
        }
      },
      [
        currentAccount,
        setIsShowing,
        getTransport,
        openSolanaApp,
        reconnectAfterAppOpen,
        waitForSolanaApp,
      ],
    )

    const showLedgerModal = useCallback(
      ({
        transaction,
        message,
      }: {
        transaction?: Buffer
        message?: Buffer
      }) => {
        if (!transaction && !message) {
          return Promise.resolve(undefined)
        }

        const promise = new Promise<Buffer>((resolve, reject) => {
          const session: SigningSession = {
            transaction,
            message,
            settled: false,
            resolve: (value) => {
              if (session.settled) return
              session.settled = true
              resolve(value)
            },
            reject: (reason) => {
              if (session.settled) return
              session.settled = true
              reject(reason)
            },
          }
          sessionRef.current = session
          runSigningSession(session)
        })

        return promise
      },
      [runSigningSession],
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

      // 'nano sp' must be checked before 'nano s', which it also contains
      if (
        currentAccount?.ledgerDevice?.name.toLowerCase().includes('nano sp')
      ) {
        model = DeviceModelId.nanoSP
      } else if (
        currentAccount?.ledgerDevice?.name.toLowerCase().includes('nano s')
      ) {
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
      }

      return model
    }, [currentAccount?.ledgerDevice?.name])

    const handleRetry = useCallback(() => {
      const session = sessionRef.current
      if (!session || session.settled) return
      runSigningSession(session)
    }, [runSigningSession])

    const closeModal = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()
    }, [])

    // Fires for every dismissal: X button, swipe down, backdrop tap, Android
    // back, and our own dismiss() after settling.
    const onDismiss = useCallback(() => {
      handleDismiss()
      const settled = settledSessionRef.current
      settledSessionRef.current = undefined
      if (sessionRef.current !== settled) {
        sessionRef.current?.reject(new Error('User closed modal'))
      }
    }, [handleDismiss])

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
        case 'failed':
          return (
            <Box>
              <Text variant="h4Medium" color="primaryText">
                {t('ledger.signingFailed')}
              </Text>
              <Text variant="body1Medium" color="secondaryText" marginTop="s">
                {failureMessage}
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
        default:
          return null
      }
    }, [
      currentAccount?.ledgerDevice?.name,
      failureMessage,
      handleRetry,
      ledgerModalState,
      t,
    ])

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
            onDismiss={onDismiss}
          >
            <BottomSheetScrollView>
              <SafeAreaBox edges={safeEdges} paddingHorizontal="l">
                <Box alignItems="flex-end" height={24} justifyContent="center">
                  <CloseButton onPress={closeModal} />
                </Box>
                {ledgerModalState === 'loading' && (
                  <Box alignItems="center" justifyContent="center" flex={1}>
                    <CircleLoader loaderSize={40} />
                  </Box>
                )}
                {ledgerModalState !== 'loading' &&
                  ledgerModalState !== 'error' && (
                    <>
                      {ledgerModalState !== 'failed' && (
                        <Box
                          alignSelf="stretch"
                          alignItems="center"
                          justifyContent="center"
                          minHeight={120}
                        >
                          <Animation
                            source={getDeviceAnimation({
                              device: {
                                deviceId:
                                  currentAccount?.ledgerDevice?.id ?? '',
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
                      )}
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
