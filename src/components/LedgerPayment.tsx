/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/jsx-props-no-spreading */
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
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import { Edge } from 'react-native-safe-area-context'
import { PaymentV1 } from '@helium/transactions'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import Ledger from '@assets/images/ledger.svg'
import { useColors, useOpacity } from '../theme/themeHooks'
import SafeAreaBox from './SafeAreaBox'
import HandleBasic from './HandleBasic'
import { signLedgerPayment, useLedger } from '../utils/heliumLedger'
import { SendDetails, useTransactions } from '../storage/TransactionProvider'
import { useAccountLazyQuery } from '../generated/graphql'
import useDisappear from '../utils/useDisappear'
import Text from './Text'
import Box from './Box'
import { LedgerDevice } from '../storage/cloudStorage'

type ShowOptions = {
  payments: SendDetails[]
  ledgerDevice: LedgerDevice
  address: string
  speculativeNonce: number
}

export type LedgerPaymentRef = {
  show: (opts: ShowOptions) => void
  hide: () => void
}

type Props = {
  children: ReactNode
  onConfirm: (opts: { txn: PaymentV1; txnJson: string }) => void
  onError: (error: Error) => void
}
const LedgerPaymentSelector = forwardRef(
  ({ children, onConfirm, onError }: Props, ref: Ref<LedgerPaymentRef>) => {
    useImperativeHandle(ref, () => ({ show, hide }))
    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const { backgroundStyle } = useOpacity('surfaceSecondary', 1)
    const { primaryText } = useColors()
    const [options, setOptions] = useState<ShowOptions>()
    const { getTransport } = useLedger()
    const { makeLedgerPaymentTxn } = useTransactions()
    const [fetchAccount] = useAccountLazyQuery({
      fetchPolicy: 'cache-and-network',
    })
    const snapPoints = useMemo(() => {
      return [600]
    }, [])

    const show = useCallback(
      async (opts: ShowOptions) => {
        setOptions(opts)
        bottomSheetModalRef.current?.present()
        try {
          // TODO: Bring this back when payment support is merged into ledger sdk
          //   const { data: accountData } = await fetchAccount({
          //     variables: { address: opts.address },
          //   })
          //   const nextTransport = await getTransport(opts.ledgerDevice.id)
          //   const { txnJson, unsignedTxn } = await makeLedgerPaymentTxn({
          //     paymentDetails: opts.payments,
          //     speculativeNonce: accountData?.account?.speculativeNonce || 0,
          //   })
          //   const payment = await signLedgerPayment(nextTransport, unsignedTxn)
          //   onConfirm({ txn: payment, txnJson })
          //   bottomSheetModalRef.current?.dismiss()
        } catch (error) {
          // in this case, user is likely not on Helium app
          console.error(error)
          onError(error as Error)
          bottomSheetModalRef.current?.dismiss()
        }
      },
      [onError],
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
              {t('ledger.payment.title')}
            </Text>
            <Text variant="subtitle1" color="secondaryText">
              {t('ledger.payment.subtitle', {
                name: options?.ledgerDevice.name,
              })}
            </Text>
          </SafeAreaBox>
        </BottomSheetModal>
        {children}
      </>
    )
  },
)

export default memo(LedgerPaymentSelector)
