/* eslint-disable react/no-array-index-key */
import BlurBox from '@components/BlurBox'
import HandleBasic from '@components/HandleBasic'
import SafeAreaBox from '@components/SafeAreaBox'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import useBackHandler from '@hooks/useBackHandler'
import { PublicKey } from '@solana/web3.js'
import React, {
  ReactNode,
  Ref,
  createContext,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useCreateExplorerUrl } from '../../constants/urls'
import { Activity } from '../../types/activity'
import TransactionLineItem from './TransactionLineItem'
import { useTxnDetails } from './useTxn'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import { Portal } from '@gorhom/portal'

type DetailData = { item: Activity; accountAddress: string; mint: PublicKey }

type Props = BoxProps<Theme>

export type TransactionDetailSelectorRef = {
  showTransaction: (DetailData) => void
}

const TransactionDetailSelector = forwardRef(
  ({ ...rest }: Props, ref: Ref<TransactionDetailSelectorRef>) => {
    useImperativeHandle(ref, () => ({ showTransaction }))

    const { t } = useTranslation()
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const [detailData, setDetailData] = useState<DetailData>()
    const [contentHeight, setContentHeight] = useState(0)
    const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)

    const { item: txn, mint } = detailData || {}

    const {
      amount,
      amountTitle,
      color,
      fee,
      feePayer,
      icon,
      paymentsReceived,
      paymentsSent,
      time,
      title,
    } = useTxnDetails(mint, txn)
    const createExplorerUrl = useCreateExplorerUrl()

    const snapPoints = useMemo(() => {
      let maxHeight: number | string = '90%'
      if (contentHeight > 0) {
        maxHeight = contentHeight
      }
      return ['50%', maxHeight]
    }, [contentHeight])

    const showTransaction = useCallback(
      (data: DetailData) => {
        setDetailData(data)
        bottomSheetModalRef.current?.present()
        setIsShowing(true)
      },
      [setIsShowing],
    )

    const safeEdges = useMemo(() => ['bottom'] as Edge[], [])

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          disappearsOnIndex={-1}
          opacity={0.8}
          appearsOnIndex={0}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ),
      [],
    )

    const backgroundComponent = useCallback(() => {
      return (
        <BlurBox
          position="absolute"
          top={0}
          bottom={0}
          left={0}
          right={0}
          borderRadius="4xl"
          overflow="hidden"
        />
      )
    }, [])

    const handleComponent = useCallback(() => <HandleBasic />, [])

    const handleContentLayout = useCallback((e: LayoutChangeEvent) => {
      setContentHeight(e.nativeEvent.layout.height)
    }, [])

    return (
      <Portal>
        <BottomSheetModalProvider>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundComponent={backgroundComponent}
            handleComponent={handleComponent}
            onDismiss={handleDismiss}
          >
            <BottomSheetScrollView>
              <SafeAreaBox
                edges={safeEdges}
                paddingVertical="6"
                onLayout={handleContentLayout}
              >
                <TransactionLineItem
                  title={t('transactions.transaction')}
                  bodyText={title}
                  icon={icon}
                />

                {paymentsSent.map(({ amount: amt }, index) => (
                  <React.Fragment key={`${index}.amountToPayee`}>
                    <TransactionLineItem
                      title={t('transactions.amountToPayee', {
                        index: index + 1,
                      })}
                      bodyText={amt}
                      bodyColor="blue.light-500"
                    />
                  </React.Fragment>
                ))}

                {paymentsReceived.map(({ amount: amt }, index) => (
                  <React.Fragment key={`${index}.amountToPayee`}>
                    <TransactionLineItem
                      title={t('transactions.amount')}
                      bodyText={amt}
                      bodyColor="green.light-500"
                    />
                  </React.Fragment>
                ))}

                {!!amountTitle && (
                  <TransactionLineItem
                    title={amountTitle}
                    bodyText={amount}
                    bodyColor={color}
                  />
                )}

                {!!fee && (
                  <TransactionLineItem
                    title={
                      feePayer
                        ? t('transactions.txnFeePaidBy', { feePayer })
                        : t('transactions.txnFee')
                    }
                    bodyText={fee}
                  />
                )}

                <TransactionLineItem
                  title={t('transactions.date')}
                  bodyText={time}
                />

                {!txn?.pending && (
                  <TransactionLineItem
                    title={t('transactions.block')}
                    bodyText={txn?.height || ''}
                    navTo={createExplorerUrl('block', txn?.height)}
                  />
                )}

                <TransactionLineItem
                  title={t('transactions.hash')}
                  bodyText={txn?.hash || ''}
                  navTo={createExplorerUrl('txn', txn?.hash)}
                />
              </SafeAreaBox>
            </BottomSheetScrollView>
          </BottomSheetModal>
        </BottomSheetModalProvider>
      </Portal>
    )
  },
)

export default TransactionDetailSelector
