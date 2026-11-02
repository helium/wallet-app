import {
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { PublicKey } from '@solana/web3.js'
import { Sheet } from '@ui/Sheet'
import { useContentColumnMargins } from '@utils/layout'
import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useCreateExplorerUrl } from '../../constants/urls'
import { Activity } from '../../types/activity'
import TransactionLineItem from './TransactionLineItem'
import { useTxnDetails } from './useTxn'

const SafeArea = withUniwind(SafeAreaView)

const initialState = {
  show: () => undefined,
}

type DetailData = { item: Activity; accountAddress: string; mint: PublicKey }
type PaymentRow = { key: string; title: string; amount: string; color: string }
type TransactionDetailSelectorActions = {
  show: (data: DetailData) => void
}
const TransactionDetailSelectorContext =
  createContext<TransactionDetailSelectorActions>(initialState)
const { Provider } = TransactionDetailSelectorContext

// The line items call navigation and account storage, so the sheet portals
// to the local provider inside the screen, not to the app's root provider.
const TransactionDetailSelector = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const sheetRef = useRef<BottomSheetModal>(null)
  const [detailData, setDetailData] = useState<DetailData>()
  const [contentHeight, setContentHeight] = useState(0)

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
  const sheetMargins = useContentColumnMargins()

  const snapPoints = ['50%', contentHeight > 0 ? contentHeight : '90%']

  const paymentRows: PaymentRow[] = [
    ...paymentsSent.map(({ amount: amt }, index) => ({
      key: `${index}.amountToPayee`,
      title: t('transactions.amountToPayee', { index: index + 1 }),
      amount: amt,
      color: 'text-blue-dark-500',
    })),
    ...paymentsReceived.map(({ amount: amt }, index) => ({
      key: `${index}.amountReceived`,
      title: t('transactions.amount'),
      amount: amt,
      color: 'text-success-500',
    })),
  ]

  const show = (data: DetailData) => {
    setDetailData(data)
    sheetRef.current?.present()
  }

  return (
    <BottomSheetModalProvider>
      <Provider value={{ show }}>
        <Sheet
          ref={sheetRef}
          index={0}
          snapPoints={snapPoints}
          style={sheetMargins}
        >
          <BottomSheetFlatList<PaymentRow>
            contentInsetAdjustmentBehavior="automatic"
            data={paymentRows}
            keyExtractor={(row) => row.key}
            onContentSizeChange={(_, height) => setContentHeight(height)}
            ListHeaderComponent={
              <View className="pt-6">
                <TransactionLineItem
                  title={t('transactions.transaction')}
                  bodyText={title}
                  icon={icon}
                />
              </View>
            }
            renderItem={({ item: row }) => (
              <TransactionLineItem
                title={row.title}
                bodyText={row.amount}
                bodyColor={row.color}
              />
            )}
            ListFooterComponent={
              <SafeArea edges={['bottom']} className="pb-6">
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
              </SafeArea>
            }
          />
        </Sheet>
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
