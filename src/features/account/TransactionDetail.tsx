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
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
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

const initialState = {
  show: () => undefined,
}

type DetailData = { item: Activity; accountAddress: string; mint: PublicKey }
type TransactionDetailSelectorActions = {
  show: (data: DetailData) => void
}
const TransactionDetailSelectorContext =
  createContext<TransactionDetailSelectorActions>(initialState)
const { Provider } = TransactionDetailSelectorContext

const TransactionDetailSelector = ({ children }: { children: ReactNode }) => {
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

  const show = useCallback(
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
        borderRadius="xl"
        overflow="hidden"
      />
    )
  }, [])

  const handleComponent = useCallback(() => <HandleBasic />, [])

  const handleContentLayout = useCallback((e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height)
  }, [])

  return (
    <BottomSheetModalProvider>
      <Provider value={{ show }}>
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
              paddingVertical="l"
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
                    bodyColor="blueBright500"
                  />
                </React.Fragment>
              ))}

              {paymentsReceived.map(({ amount: amt }, index) => (
                <React.Fragment key={`${index}.amountToPayee`}>
                  <TransactionLineItem
                    title={t('transactions.amount')}
                    bodyText={amt}
                    bodyColor="greenBright500"
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
        {children}
      </Provider>
    </BottomSheetModalProvider>
  )
}

export const useTransactionDetail = () =>
  useContext(TransactionDetailSelectorContext)

export const withTransactionDetail = (Component: FC) => () => {
  return (
    <TransactionDetailSelector>
      <Component />
    </TransactionDetailSelector>
  )
}
