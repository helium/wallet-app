import CloseButton from '@components/CloseButton'
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import useBackHandler from '@hooks/useBackHandler'
import useLedger, { LedgerTransport } from '@hooks/useLedger'
import { DeviceModelId } from '@ledgerhq/types-devices'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { View } from 'react-native'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'
import { useResolveClassNames, withUniwind } from 'uniwind'
import {
  classifyLedgerError,
  signLedgerMessage,
  signLedgerTransaction,
  getDerivationTypeForSigning,
} from '@utils/heliumLedger'
import React, {
  memo,
  ReactNode,
  Ref,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useSheetMargins } from '@components/ContentColumn'
import { useTranslation } from 'react-i18next'
import Animation from './Animation'
import LedgerConnectSteps from './LedgerConnectSteps'
import { getDeviceAnimation } from './getDeviceAnimation'

const SafeArea = withUniwind(SafeAreaView)

const ANIMATION_STYLE = { height: 120 }
const STAX_ANIMATION_STYLE = { height: 210 }

const EDGES: Edge[] = ['bottom']

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
  | 'scanning'
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
  ref?: Ref<LedgerModalRef | undefined>
}

const LedgerBackdrop = (props: BottomSheetBackdropProps) => (
  <BottomSheetBackdrop disappearsOnIndex={-1} appearsOnIndex={0} {...props} />
)

const deviceModelIdFor = (name?: string) => {
  let model = DeviceModelId.nanoX

  if (!name) {
    return model
  }

  // 'nano sp' must be checked before 'nano s', which it also contains
  if (name.toLowerCase().includes('nano sp')) {
    model = DeviceModelId.nanoSP
  } else if (name.toLowerCase().includes('nano s')) {
    model = DeviceModelId.nanoS
  } else if (name.toLowerCase().includes('nano x')) {
    model = DeviceModelId.nanoX
  } else if (name.toLowerCase().includes('stax')) {
    model = DeviceModelId.stax
  } else if (name.toLowerCase().includes('blue')) {
    model = DeviceModelId.blue
  }

  return model
}

const LedgerModal = ({ children, ref }: Props) => {
  // The compiler skips this component: it throws inside a try/catch
  'use no memo'
  const { currentAccount, upsertAccount } = useAccountStorage()
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const sheetMargins = useSheetMargins()
  const backgroundStyle = useResolveClassNames('bg-secondary')
  const handleIndicatorStyle = useResolveClassNames('bg-muted-foreground')
  const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)
  const { t } = useTranslation()
  const {
    getTransport,
    findBleDevice,
    openBleDevice,
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

  const runSigningSession = async (session: SigningSession) => {
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

      let transport: LedgerTransport | undefined
      try {
        transport = await getTransport(deviceId, deviceType)
      } catch (error) {
        if (
          deviceType !== 'bluetooth' ||
          classifyLedgerError(error) !== 'transport'
        ) {
          throw error
        }
        // The stored BLE id may be from another phone or a forgotten
        // pairing. Find the device by name and pair it by descriptor.
        setLedgerModalState('scanning')
        const found = await findBleDevice(currentAccount.ledgerDevice.name)
        if (!found) throw error
        transport = await openBleDevice(found)
        await upsertAccount({
          ...currentAccount,
          ledgerDevice: { ...currentAccount.ledgerDevice, id: found.id },
        })
      }
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
        transport = await reconnectAfterAppOpen(transport, deviceId, deviceType)
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
  }

  const showLedgerModal = ({
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
      void runSigningSession(session)
    })

    return promise
  }

  useImperativeHandle(ref, () => ({ showLedgerModal }))

  const deviceModelId = deviceModelIdFor(currentAccount?.ledgerDevice?.name)

  const handleRetry = () => {
    const session = sessionRef.current
    if (!session || session.settled) return
    void runSigningSession(session)
  }

  const closeModal = () => {
    bottomSheetModalRef.current?.dismiss()
  }

  // Fires for every dismissal: X button, swipe down, backdrop tap, Android
  // back, and our own dismiss() after settling.
  const onDismiss = () => {
    handleDismiss()
    const settled = settledSessionRef.current
    settledSessionRef.current = undefined
    if (sessionRef.current !== settled) {
      sessionRef.current?.reject(new Error('User closed modal'))
    }
  }

  const renderLedgerMessage = () => {
    switch (ledgerModalState) {
      case 'loading':
        return null
      case 'scanning':
        return (
          <Text size="xl" className="font-medium">
            {t('ledger.lookingForDevice', {
              device: currentAccount?.ledgerDevice?.name,
            })}
          </Text>
        )
      case 'openApp':
        return (
          <Text size="xl" className="font-medium">
            {t('ledger.openTheSolanaApp', {
              device: currentAccount?.ledgerDevice?.name,
            })}
          </Text>
        )
      case 'sign':
        return (
          <Text size="xl" className="font-medium">
            {t('ledger.pleaseConfirmTransaction', {
              device: currentAccount?.ledgerDevice?.name,
            })}
          </Text>
        )
      case 'enterPinCode':
        return (
          <View>
            <Text size="xl" className="font-medium">
              {t('ledger.pleaseEnterPinCode', {
                device: currentAccount?.ledgerDevice?.name,
              })}
            </Text>
            <Button
              variant="secondary"
              size="lg"
              className="mt-2 w-full"
              onPress={handleRetry}
            >
              {t('generic.tryAgain')}
            </Button>
          </View>
        )
      case 'enableBlindSign':
        return (
          <View>
            <Text size="xl" className="font-medium">
              {t('ledger.enableBlindSign')}
            </Text>
            <Button
              variant="secondary"
              size="lg"
              className="mt-2 w-full"
              onPress={handleRetry}
            >
              {t('generic.tryAgain')}
            </Button>
          </View>
        )
      case 'failed':
        return (
          <View>
            <Text size="xl" className="font-medium">
              {t('ledger.signingFailed')}
            </Text>
            <Text
              size="base"
              className="mt-2 font-medium text-muted-foreground"
            >
              {failureMessage}
            </Text>
            <Button
              variant="secondary"
              size="lg"
              className="mt-2 w-full"
              onPress={handleRetry}
            >
              {t('generic.tryAgain')}
            </Button>
          </View>
        )
      default:
        return null
    }
  }

  return (
    <View className="flex-1">
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          style={sheetMargins}
          index={0}
          backgroundStyle={backgroundStyle}
          backdropComponent={LedgerBackdrop}
          handleIndicatorStyle={handleIndicatorStyle}
          enableDynamicSizing
          onDismiss={onDismiss}
        >
          <BottomSheetScrollView contentInsetAdjustmentBehavior="automatic">
            <SafeArea edges={EDGES} className="px-6">
              <View className="h-6 items-end justify-center">
                <CloseButton onPress={closeModal} />
              </View>
              {ledgerModalState === 'loading' && (
                <View className="flex-1 items-center justify-center">
                  <Spinner size="large" />
                </View>
              )}
              {ledgerModalState !== 'loading' &&
                ledgerModalState !== 'error' && (
                  <>
                    {ledgerModalState !== 'failed' &&
                      ledgerModalState !== 'scanning' && (
                        <View className="min-h-[120px] items-center justify-center self-stretch">
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
                                ? STAX_ANIMATION_STYLE
                                : ANIMATION_STYLE
                            }
                          />
                        </View>
                      )}
                    <View>{renderLedgerMessage()}</View>
                  </>
                )}
              {ledgerModalState === 'error' && (
                <View className="mb-6">
                  <LedgerConnectSteps onRetry={handleRetry} />
                </View>
              )}
            </SafeArea>
          </BottomSheetScrollView>
        </BottomSheetModal>
        {children}
      </BottomSheetModalProvider>
    </View>
  )
}

export default memo(LedgerModal)
