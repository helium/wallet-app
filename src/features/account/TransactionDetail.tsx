/* eslint-disable react/no-array-index-key */
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import { Edge } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Activity } from '../../generated/graphql'
import SafeAreaBox from '../../components/SafeAreaBox'
import TransactionLineItem from './TransactionLineItem'
import HandleBasic from '../../components/HandleBasic'
import ExpoBlurBox from '../../components/ExpoBlurBox'
import useTxn from './useTxn'
import { useBalance } from '../../utils/Balance'
import { useExplorer } from '../../constants/urls'
import { decodeMemoString, DEFAULT_MEMO } from '../../components/MemoInput'

const initialState = {
  show: () => undefined,
}

type DetailData = { item: Activity; accountAddress: string }
type TransactionDetailSelectorActions = {
  show: (data: DetailData) => void
}
const TransactionDetailSelectorContext =
  createContext<TransactionDetailSelectorActions>(initialState)
const { Provider } = TransactionDetailSelectorContext

const TransactionDetailSelector = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [item, setItem] = useState<DetailData>()

  const { intToBalance } = useBalance()
  const { item: txn, accountAddress } = item || {}

  const { listIcon, title, time, color } = useTxn(txn, accountAddress || '', {
    dateFormat: 'dd MMMM yyyy HH:MM',
  })

  const explorerURL = useExplorer()

  const snapPoints = useMemo(() => {
    return ['50%', '90%']
  }, [])

  const show = useCallback((data: DetailData) => {
    setItem(data)
    bottomSheetModalRef.current?.present()
  }, [])

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
      <ExpoBlurBox
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

  const payments = useMemo(() => {
    if (txn?.payer !== accountAddress || !txn?.payments) {
      return []
    }
    return txn.payments.map(({ amount: amt, payee, memo }) => {
      const balance = intToBalance({ intValue: amt })
      return { amount: `-${balance}`, payee, memo }
    })
  }, [accountAddress, intToBalance, txn])

  const paymentsReceived = useMemo(
    () =>
      (txn?.payments || []).reduce((acc, { payee, amount: amt, memo }) => {
        if (payee !== accountAddress) {
          return acc
        }
        const balance = intToBalance({ intValue: amt })

        const next = [{ amount: `+${balance}`, payee, memo }, ...acc] as {
          memo: string
          amount: string
          payee: string
        }[]
        return next
      }, [] as Array<{ memo: string; amount: string; payee: string }>),
    [accountAddress, intToBalance, txn],
  )

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
        >
          <BottomSheetScrollView>
            <SafeAreaBox edges={safeEdges} paddingVertical="l">
              <TransactionLineItem
                title={t('transactionDetail.transaction')}
                bodyText={title}
                icon={listIcon}
              />

              {payments.map(({ amount: amt, payee, memo }, index) => (
                <React.Fragment key={`${index}.amountToPayee`}>
                  <TransactionLineItem
                    title={t('transactionDetail.amountToPayee', {
                      index: index + 1,
                    })}
                    bodyText={amt}
                    bodyColor={color}
                  />
                  <TransactionLineItem
                    title={t('transactionDetail.payee', {
                      index: index + 1,
                    })}
                    bodyText={payee}
                    isAddress
                    navTo={`${explorerURL}/accounts/${payee}`}
                  />
                  {memo !== undefined && memo !== DEFAULT_MEMO && (
                    <TransactionLineItem
                      title={t('transactionDetail.memo')}
                      bodyText={decodeMemoString(memo)}
                    />
                  )}
                </React.Fragment>
              ))}

              {paymentsReceived.map(({ amount: amt, payee, memo }, index) => (
                <React.Fragment key={`${index}.amountToPayee`}>
                  <TransactionLineItem
                    title={t('transactionDetail.amount')}
                    bodyText={amt}
                    bodyColor={color}
                  />
                  <TransactionLineItem
                    title={t('transactionDetail.from')}
                    bodyText={payee}
                    isAddress
                    navTo={`${explorerURL}/accounts/${payee}`}
                  />
                  {memo !== undefined && memo !== DEFAULT_MEMO && (
                    <TransactionLineItem
                      title={t('transactionDetail.memo')}
                      bodyText={decodeMemoString(memo)}
                    />
                  )}
                </React.Fragment>
              ))}

              <TransactionLineItem
                title={t('transactionDetail.date')}
                bodyText={time}
              />

              <TransactionLineItem
                title={t('transactionDetail.block')}
                bodyText={txn?.height || ''}
                navTo={`${explorerURL}/blocks/${txn?.height}`}
              />

              <TransactionLineItem
                title={t('transactionDetail.hash')}
                bodyText={txn?.hash || ''}
                navTo={
                  txn?.pending ? undefined : `${explorerURL}/txns/${txn?.hash}`
                }
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

export const withTransactionDetail = (Component: FC) => () =>
  (
    <TransactionDetailSelector>
      <Component />
    </TransactionDetailSelector>
  )
