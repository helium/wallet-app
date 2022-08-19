import React, {
  forwardRef,
  memo,
  ReactNode,
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { Edge } from 'react-native-safe-area-context'
import { TokenBurnV1 } from '@helium/transactions'
import Ledger from '@assets/images/ledger.svg'
import { useTranslation } from 'react-i18next'
import { useColors, useOpacity } from '../theme/themeHooks'
import { signLedgerBurn, useLedger } from '../utils/heliumLedger'
import { LedgerDevice } from '../storage/cloudStorage'
import HandleBasic from './HandleBasic'
import SafeAreaBox from './SafeAreaBox'
import Box from './Box'
import Text from './Text'
import * as Logger from '../utils/logger'
import useAlert from '../utils/useAlert'
import useBackHandler from '../utils/useBackHandler'

type ShowOptions = {
  ledgerDevice: LedgerDevice
  unsignedTxn: TokenBurnV1
  txnJson: string
  accountIndex: number
}

export type LedgerBurnRef = {
  show: (opts: ShowOptions) => void
  hide: () => void
}

type Props = {
  children: ReactNode
  onConfirm: (opts: { txn: TokenBurnV1; txnJson: string }) => void
  onError: (error: Error) => void
  title: string
  subtitle: string
}
const LedgerBurn = forwardRef(
  (
    { children, onConfirm, onError, title, subtitle }: Props,
    ref: Ref<LedgerBurnRef>,
  ) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { showOKAlert } = useAlert()
    const { t } = useTranslation()
    const { primaryText } = useColors()
    const { getTransport } = useLedger()
    const snapPoints = useMemo(() => {
      return [600]
    }, [])
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)

    const show = useCallback(
      async (opts: ShowOptions) => {
        bottomSheetModalRef.current?.present()
        setIsShowing(true)
        try {
          const nextTransport = await getTransport(
            opts.ledgerDevice.id,
            opts.ledgerDevice.type,
          )
          if (!nextTransport) {
            showOKAlert({
              title: t('ledger.deviceNotFound.title'),
              message: t('addressBook.deviceNotFound.message'),
            })
            return
          }
          const payment = await signLedgerBurn(
            nextTransport,
            opts.unsignedTxn,
            opts.accountIndex,
          )
          onConfirm({ txn: payment.txn, txnJson: opts.txnJson })
          bottomSheetModalRef.current?.dismiss()
        } catch (error) {
          // in this case, user is likely not on Helium app
          Logger.error(error)
          onError(error as Error)
          bottomSheetModalRef.current?.dismiss()
        }
      },
      [getTransport, onConfirm, onError, setIsShowing, showOKAlert, t],
    )

    const hide = useCallback(() => {
      bottomSheetModalRef.current?.dismiss()
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

    const renderHandle = useCallback(() => {
      return <HandleBasic marginTop="s" marginBottom="m" />
    }, [])

    const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

    return (
      <>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          backgroundStyle={backgroundStyle}
          backdropComponent={renderBackdrop}
          handleComponent={renderHandle}
          snapPoints={snapPoints}
          onDismiss={handleDismiss}
        >
          <SafeAreaBox
            flex={1}
            edges={safeEdges}
            paddingHorizontal="l"
            flexDirection="column"
            alignItems="center"
          >
            <Box marginBottom="xl">
              <Ledger width={100} height={100} color={primaryText} />
            </Box>
            <Text variant="h1" marginBottom="l">
              {title}
            </Text>
            <Text variant="subtitle1" color="secondaryText">
              {subtitle}
            </Text>
          </SafeAreaBox>
        </BottomSheetModal>
        {children}
      </>
    )
  },
)

export default memo(LedgerBurn)
