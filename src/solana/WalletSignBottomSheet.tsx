import React, {
  forwardRef,
  memo,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import Checkmark from '@assets/images/checkmark.svg'
import { useTranslation } from 'react-i18next'
import {
  BottomSheetBackdrop,
  useBottomSheetDynamicSnapPoints,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { Edge } from 'react-native-safe-area-context'
import SafeAreaBox from '@components/SafeAreaBox'
import Box from '@components/Box'
import Text from '@components/Text'
import { useColors, useOpacity } from '@theme/themeHooks'
import ButtonPressable from '@components/ButtonPressable'
import { useSimulatedTransaction } from '@hooks/useSimulatedTransaction'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import CircleLoader from '@components/CircleLoader'
import { useSolana } from './SolanaProvider'
import {
  WalletSignBottomSheetRef,
  WalletSignBottomSheetProps,
  WalletSignOpts,
  WalletStandardMessageTypes,
} from './walletSignBottomSheetTypes'

let promiseResolve: (value: boolean | PromiseLike<boolean>) => void

const WalletSignBottomSheet = forwardRef(
  (
    { onClose, children }: WalletSignBottomSheetProps,
    ref: Ref<WalletSignBottomSheetRef>,
  ) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { anchorProvider } = useSolana()
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { secondaryText } = useColors()
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const [walletSignOpts, setWalletSignOpts] = useState<WalletSignOpts>({
      type: WalletStandardMessageTypes.connect,
      url: '',
      additionalMessage: '',
      manualBalanceChanges: undefined,
      manualEstimatedFee: undefined,
      serializedTx: undefined,
    })
    const { loading, balanceChanges, solFee, insufficientFunds } =
      useSimulatedTransaction(
        walletSignOpts.serializedTx,
        anchorProvider?.publicKey,
      )

    const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
    const snapPoints = useMemo(() => ['25%', 'CONTENT_HEIGHT'], [])

    const {
      animatedHandleHeight,
      animatedSnapPoints,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(snapPoints)

    const hide = useCallback(() => {
      bottomSheetModalRef.current?.close()
    }, [])

    const show = useCallback(
      ({
        type,
        url,
        additionalMessage,
        manualBalanceChanges,
        manualEstimatedFee,
        serializedTx,
      }: WalletSignOpts) => {
        bottomSheetModalRef.current?.expand()
        setWalletSignOpts({
          type,
          url,
          additionalMessage,
          manualBalanceChanges,
          manualEstimatedFee,
          serializedTx,
        })
        const p = new Promise<boolean>((resolve) => {
          promiseResolve = resolve
        })
        return p
      },
      [],
    )

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
      // We need to re present the bottom sheet after it is dismissed so that it can be expanded again
      bottomSheetModalRef.current?.present()
      if (onClose) {
        onClose()
      }
    }, [onClose])

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: secondaryText,
      }
    }, [secondaryText])

    const onAcceptHandler = useCallback(() => {
      if (promiseResolve) {
        hide()
        promiseResolve(true)
      }
    }, [hide])

    const onCancelHandler = useCallback(() => {
      if (promiseResolve) {
        hide()
        promiseResolve(false)
      }
    }, [hide])

    const renderSheetBody = useCallback(() => {
      const {
        type,
        additionalMessage,
        manualBalanceChanges,
        manualEstimatedFee,
      } = walletSignOpts

      if (type === WalletStandardMessageTypes.connect) {
        return (
          <>
            <Box flexGrow={1} justifyContent="center">
              <Box
                borderRadius="l"
                backgroundColor="secondaryBackground"
                flexDirection="column"
                padding="m"
              >
                <Box flexDirection="row" marginBottom="m">
                  <Checkmark color="white" />
                  <Text variant="body1" marginStart="s">
                    {t('browserScreen.connectBullet1')}
                  </Text>
                </Box>
                <Box flexDirection="row">
                  <Checkmark color="white" />
                  <Text marginStart="s" variant="body1">
                    {t('browserScreen.connectBullet2')}
                  </Text>
                </Box>
              </Box>
              <Box>
                <Text
                  variant="body1"
                  color="secondaryText"
                  textAlign="center"
                  marginTop="m"
                >
                  {t('browserScreen.connectToWebsitesYouTrust')}
                </Text>
              </Box>
            </Box>
          </>
        )
      }
      if (
        type === WalletStandardMessageTypes.signMessage ||
        type === WalletStandardMessageTypes.signAndSendTransaction ||
        type === WalletStandardMessageTypes.signTransaction
      ) {
        return (
          <>
            <Box flexGrow={1} justifyContent="center">
              <Box
                borderTopStartRadius="l"
                borderTopEndRadius="l"
                backgroundColor="secondaryBackground"
                padding="m"
                borderBottomColor="black"
                borderBottomWidth={1}
              >
                <Text variant="body1Medium">
                  {t('browserScreen.estimatedChanges')}
                </Text>
              </Box>

              {additionalMessage && (
                <Box
                  backgroundColor="secondaryBackground"
                  borderBottomColor="black"
                  borderBottomWidth={1}
                  padding="m"
                >
                  <Text variant="body1Medium" color="secondaryText">
                    {additionalMessage}
                  </Text>
                </Box>
              )}

              {insufficientFunds && (
                <Box
                  borderBottomStartRadius="l"
                  borderBottomEndRadius="l"
                  backgroundColor="secondaryBackground"
                  padding="m"
                >
                  <Text variant="body1Medium" color="red500">
                    {t('browserScreen.insufficientFunds')}
                  </Text>
                </Box>
              )}
              {!balanceChanges?.length && !manualBalanceChanges?.length && (
                <Box
                  borderBottomStartRadius="l"
                  borderBottomEndRadius="l"
                  backgroundColor="secondaryBackground"
                  padding="m"
                >
                  <Text variant="body1Medium" color="orange500">
                    {t('browserScreen.unableToSimulate')}
                  </Text>
                </Box>
              )}

              {balanceChanges &&
                balanceChanges.map((change, index) => {
                  const isLast = index === balanceChanges.length - 1
                  const isSend = change.type === 'send'
                  let balanceChange
                  if (change.nativeChange) {
                    if (change.type === 'send') {
                      balanceChange = t('browserScreen.sendToken', {
                        ticker: change.symbol,
                        amount: change.nativeChange,
                      })
                    } else {
                      balanceChange = t('browserScreen.recieveToken', {
                        ticker: change.symbol,
                        amount: change.nativeChange,
                      })
                    }
                  }

                  return (
                    <Box
                      key={(change.symbol || '') + (change.nativeChange || '')}
                      borderBottomStartRadius={isLast ? 'l' : 'none'}
                      borderBottomEndRadius={isLast ? 'l' : 'none'}
                      backgroundColor="secondaryBackground"
                      padding="m"
                      borderBottomColor="black"
                      borderBottomWidth={isLast ? 0 : 1}
                    >
                      <Text
                        variant="body1Medium"
                        color={isSend ? 'red500' : 'greenBright500'}
                      >
                        {balanceChange}
                      </Text>
                    </Box>
                  )
                })}

              {manualBalanceChanges &&
                manualBalanceChanges.map((change, index) => {
                  const isLast = index === manualBalanceChanges.length - 1
                  const isSend = change.type === 'send'
                  const balanceChange = t(
                    isSend
                      ? 'browserScreen.sendToken'
                      : 'browserScreen.recieveToken',
                    {
                      ticker: change.ticker,
                      amount: change.amount,
                    },
                  )
                  return (
                    <Box
                      key={change.ticker + change.amount}
                      borderBottomStartRadius={isLast ? 'l' : 'none'}
                      borderBottomEndRadius={isLast ? 'l' : 'none'}
                      backgroundColor="secondaryBackground"
                      padding="m"
                      borderBottomColor="black"
                      borderBottomWidth={isLast ? 0 : 1}
                    >
                      <Text
                        variant="body1Medium"
                        color={isSend ? 'red500' : 'greenBright500'}
                      >
                        {balanceChange}
                      </Text>
                    </Box>
                  )
                })}

              {type === WalletStandardMessageTypes.signAndSendTransaction ||
                (type === WalletStandardMessageTypes.signTransaction && (
                  <Box
                    marginTop="m"
                    borderRadius="l"
                    backgroundColor="secondaryBackground"
                    padding="m"
                    flexDirection="row"
                  >
                    <Box flexGrow={1}>
                      <Text variant="body1Medium">
                        {t('browserScreen.networkFee')}
                      </Text>
                    </Box>
                    <Text variant="body1Medium" color="secondaryText">
                      {`~${
                        (manualEstimatedFee || solFee || 5000) /
                        LAMPORTS_PER_SOL
                      } SOL`}
                    </Text>
                  </Box>
                ))}
            </Box>
          </>
        )
      }
    }, [walletSignOpts, t, insufficientFunds, balanceChanges, solFee])

    const renderSheetFooter = useCallback(() => {
      if (!walletSignOpts) return null

      const { type } = walletSignOpts
      return (
        <>
          <Box
            flexDirection="row"
            justifyContent="space-between"
            marginBottom="m"
            marginTop="l"
          >
            <ButtonPressable
              width="48%"
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacity={0.1}
              backgroundColorOpacityPressed={0.05}
              titleColorPressedOpacity={0.3}
              titleColor="white"
              title={t('browserScreen.cancel')}
              onPress={onCancelHandler}
            />

            <ButtonPressable
              width="48%"
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="surfaceSecondary"
              backgroundColorDisabledOpacity={0.5}
              titleColorDisabled="secondaryText"
              title={
                type === WalletStandardMessageTypes.connect
                  ? t('browserScreen.connect')
                  : t('browserScreen.approve')
              }
              titleColor="black"
              onPress={onAcceptHandler}
            />
          </Box>
        </>
      )
    }, [onAcceptHandler, onCancelHandler, walletSignOpts, t])

    useEffect(() => {
      bottomSheetModalRef.current?.present()
    }, [bottomSheetModalRef])

    return (
      <Box flex={1}>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={-1}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            snapPoints={animatedSnapPoints}
            onDismiss={handleModalDismiss}
            enableDismissOnClose
            handleIndicatorStyle={handleIndicatorStyle}
            // https://ethercreative.github.io/react-native-shadow-generator/
            style={{
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 12,
              },
              shadowOpacity: 0.58,
              shadowRadius: 16.0,
              elevation: 24,
            }}
            handleHeight={animatedHandleHeight}
            contentHeight={animatedContentHeight}
          >
            <SafeAreaBox
              edges={safeEdges}
              padding="m"
              flex={1}
              onLayout={handleContentLayout}
            >
              <Box marginBottom="l">
                <Text
                  variant="body1Medium"
                  color="secondaryText"
                  textAlign="center"
                >
                  {walletSignOpts?.url || ''}
                </Text>
              </Box>
              {!loading ? (
                renderSheetBody()
              ) : (
                <Box marginVertical="m">
                  <CircleLoader loaderSize={60} />
                </Box>
              )}
              {renderSheetFooter()}
            </SafeAreaBox>
          </BottomSheetModal>
          {children}
        </BottomSheetModalProvider>
      </Box>
    )
  },
)

export default memo(WalletSignBottomSheet)
