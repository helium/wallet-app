import React, {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import Checkmark from '@assets/images/checkmark.svg'
import { useTranslation } from 'react-i18next'
import BottomSheet, {
  BottomSheetBackdrop,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import { Edge } from 'react-native-safe-area-context'
import { Portal } from '@gorhom/portal'
import { Balance, SolTokens } from '@helium/currency'
import CurrencyFormatter from 'react-native-currency-format'
import SafeAreaBox from '../../components/SafeAreaBox'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useColors, useOpacity } from '../../theme/themeHooks'
import ButtonPressable from '../../components/ButtonPressable'
import { useAppStorage } from '../../storage/AppStorageProvider'

export enum WalletStandardMessageTypes {
  connect = 'connect',
  signTransaction = 'signTransaction',
  signAndSendTransaction = 'signAndSendTransaction',
  signMessage = 'signMessage',
}

type WalletSignOpts = {
  type: WalletStandardMessageTypes
  url: string
  fee?: Balance<SolTokens>
}

export type WalletSignBottomSheetRef = {
  show: ({ type, url, fee }: WalletSignOpts) => Promise<boolean>
  hide: () => void
}

type Props = {
  onClose: () => void
  children: ReactNode
}

let promiseResolve: (value: boolean | PromiseLike<boolean>) => void

const WalletSignBottomSheet = forwardRef(
  ({ onClose, children }: Props, ref: Ref<WalletSignBottomSheetRef>) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { currency } = useAppStorage()
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { secondaryText } = useColors()
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheet>(null)
    const [walletSignOpts, setWalletSignOpts] = useState<
      WalletSignOpts & { fee: Balance<SolTokens> }
    >({
      type: WalletStandardMessageTypes.connect,
      url: '',
      fee: Balance.fromIntAndTicker(0, 'SOL'),
    })

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

    const show = useCallback(({ type, url, fee }: WalletSignOpts) => {
      bottomSheetModalRef.current?.expand()
      setWalletSignOpts((w) => {
        return {
          type,
          url,
          fee: fee || w.fee,
        }
      })
      const p = new Promise<boolean>((resolve) => {
        promiseResolve = resolve
      })
      return p
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
      if (promiseResolve) {
        promiseResolve(false)
      }
      onClose()
    }, [onClose])

    const handleIndicatorStyle = useMemo(() => {
      return {
        backgroundColor: secondaryText,
      }
    }, [secondaryText])

    const onAcceptHandler = useCallback(() => {
      if (promiseResolve) {
        promiseResolve(true)
        hide()
      }
    }, [hide])

    const onCancelHandler = useCallback(() => {
      if (promiseResolve) {
        promiseResolve(false)
        hide()
      }
    }, [hide])

    const renderSheetBody = useCallback(() => {
      const { type, fee } = walletSignOpts

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
                    {t('browser.connectBullet1')}
                  </Text>
                </Box>
                <Box flexDirection="row">
                  <Checkmark color="white" />
                  <Text marginStart="s" variant="body1">
                    {t('browser.connectBullet2')}
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
                  {t('browser.connectToWebsitesYouTrust')}
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
                  {t('browser.estimatedChanges')}
                </Text>
              </Box>

              <Box
                borderBottomStartRadius="l"
                borderBottomEndRadius="l"
                backgroundColor="secondaryBackground"
                padding="m"
              >
                <Text variant="body1Medium" color="orange500">
                  {t('browser.unableToSimulate')}
                </Text>
              </Box>

              {type === WalletStandardMessageTypes.signAndSendTransaction && (
                <Box
                  marginTop="m"
                  borderRadius="l"
                  backgroundColor="secondaryBackground"
                  padding="m"
                  flexDirection="row"
                >
                  <Box flexGrow={1}>
                    <Text variant="body1Medium">{t('browser.networkFee')}</Text>
                  </Box>
                  <Text variant="body1Medium" color="secondaryText">
                    {CurrencyFormatter.format(fee.floatBalance, currency)}
                  </Text>
                </Box>
              )}
            </Box>
          </>
        )
      }
    }, [walletSignOpts, t, currency])

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
              title={t('browser.cancel')}
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
                  ? t('browser.connect')
                  : t('browser.approve')
              }
              titleColor="black"
              onPress={onAcceptHandler}
            />
          </Box>
        </>
      )
    }, [onAcceptHandler, onCancelHandler, walletSignOpts, t])
    return (
      <Box flex={1}>
        {children}
        <Portal>
          <BottomSheet
            ref={bottomSheetModalRef}
            index={-1}
            backgroundStyle={backgroundStyle}
            backdropComponent={renderBackdrop}
            snapPoints={animatedSnapPoints}
            onClose={handleModalDismiss}
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
              {renderSheetBody()}
              {renderSheetFooter()}
            </SafeAreaBox>
          </BottomSheet>
        </Portal>
      </Box>
    )
  },
)

export default memo(WalletSignBottomSheet)
