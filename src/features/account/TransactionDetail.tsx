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
import { groupBy } from 'lodash'
import animalName from 'angry-purple-tiger'
import { LayoutChangeEvent, Platform } from 'react-native'
import { Activity } from '../../generated/graphql'
import SafeAreaBox from '../../components/SafeAreaBox'
import TransactionLineItem from './TransactionLineItem'
import HandleBasic from '../../components/HandleBasic'
import ExpoBlurBox from '../../components/ExpoBlurBox'
import { useTxnDetails } from './useTxn'
import { useBalance } from '../../utils/Balance'
import { useExplorer, usePublicApi } from '../../constants/urls'
import { decodeMemoString, DEFAULT_MEMO } from '../../components/MemoInput'
import { ellipsizeAddress } from '../../utils/accountUtils'

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
  const [detailData, setDetailData] = useState<DetailData>()
  const [contentHeight, setContentHeight] = useState(0)

  const { intToBalance } = useBalance()
  const { item: txn, accountAddress } = detailData || {}

  const {
    feePayer,
    icon,
    title,
    time,
    color,
    fee,
    paymentsReceived,
    paymentsSent,
    amount,
    amountTitle,
    hotspotName,
    validatorName,
  } = useTxnDetails(txn, accountAddress || '')
  const explorerURL = useExplorer()
  const apiUrl = usePublicApi()

  const snapPoints = useMemo(() => {
    let maxHeight: number | string = '90%'
    if (contentHeight > 0) {
      maxHeight = contentHeight
    }
    return ['50%', maxHeight]
  }, [contentHeight])

  const show = useCallback((data: DetailData) => {
    setDetailData(data)
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
        intensity={Platform.OS === 'android' ? 90 : 50}
        tint={Platform.OS === 'android' ? 'dark' : 'default'}
      />
    )
  }, [])

  const handleComponent = useCallback(() => <HandleBasic />, [])

  const rewards = useMemo(() => {
    if (!txn?.rewards?.length) return null

    const grouped = groupBy(txn.rewards, (reward) => {
      if (reward.type === 'securities') return reward.type

      return `${reward.gateway}.${reward.type}`
    })

    return Object.keys(grouped).map((key) => {
      const group = grouped[key]
      const totalAmount = group.reduce((sum, { amount: amt }) => sum + amt, 0)
      const balance = intToBalance({ intValue: totalAmount })
      const typeName = t(`transactions.rewardTypes.${group[0].type}`)
      let name = ''
      if (group[0].gateway) {
        name = animalName(group[0].gateway)
      } else {
        name = typeName
      }
      return {
        name,
        amount: balance,
        type: typeName,
      }
    })
  }, [intToBalance, t, txn])

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

              {!!hotspotName && (
                <TransactionLineItem
                  title={t('transactions.hotspot')}
                  bodyText={hotspotName}
                  navTo={`${explorerURL}/hotspots/${txn?.gateway}`}
                />
              )}
              {!!validatorName && (
                <TransactionLineItem
                  title={t('transactions.validator')}
                  bodyText={validatorName}
                  navTo={`${explorerURL}/validators/${txn?.gateway}`}
                />
              )}

              {!!txn?.buyer && (
                <TransactionLineItem
                  title={t('transactions.buyer')}
                  bodyText={ellipsizeAddress(txn.buyer)}
                  navTo={`${explorerURL}/accounts/${txn.buyer}`}
                />
              )}

              {!!txn?.seller && (
                <TransactionLineItem
                  title={t('transactions.seller')}
                  bodyText={ellipsizeAddress(txn.seller)}
                  navTo={`${explorerURL}/accounts/${txn.seller}`}
                />
              )}

              {paymentsSent.map(({ amount: amt, payee, memo }, index) => (
                <React.Fragment key={`${index}.amountToPayee`}>
                  <TransactionLineItem
                    title={t('transactions.amountToPayee', {
                      index: index + 1,
                    })}
                    bodyText={amt}
                    bodyColor={color}
                  />
                  <TransactionLineItem
                    title={t('transactions.payee', {
                      index: index + 1,
                    })}
                    bodyText={payee}
                    isAddress
                    navTo={`${explorerURL}/accounts/${payee}`}
                  />
                  {memo !== undefined && memo !== DEFAULT_MEMO && (
                    <TransactionLineItem
                      title={t('transactions.memo')}
                      bodyText={decodeMemoString(memo)}
                    />
                  )}
                </React.Fragment>
              ))}

              {paymentsReceived.map(({ amount: amt, memo }, index) => (
                <React.Fragment key={`${index}.amountToPayee`}>
                  <TransactionLineItem
                    title={t('transactions.amount')}
                    bodyText={amt}
                    bodyColor={color}
                  />
                  <TransactionLineItem
                    title={t('transactions.from')}
                    bodyText={txn?.payer || ''}
                    isAddress
                    navTo={
                      txn?.payer
                        ? `${explorerURL}/accounts/${txn?.payer}`
                        : undefined
                    }
                  />
                  {memo !== undefined && memo !== DEFAULT_MEMO && (
                    <TransactionLineItem
                      title={t('transactions.memo')}
                      bodyText={decodeMemoString(memo)}
                    />
                  )}
                </React.Fragment>
              ))}

              {rewards?.map((reward, index) => {
                return (
                  <TransactionLineItem
                    key={`rewards.${index}`}
                    title={reward.name}
                    bodyTextEnd={reward.amount?.toString() || ''}
                    bodyEndColor={color}
                    bodyText={reward.type}
                  />
                )
              })}

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

              {!!txn?.owner && (
                <TransactionLineItem
                  title={t('transactions.owner')}
                  bodyText={txn.owner}
                  navTo={`${explorerURL}/accounts/${txn.owner}`}
                />
              )}

              {!!txn?.oldOwner && (
                <TransactionLineItem
                  title={t('transactions.oldOwner')}
                  bodyText={txn.oldOwner}
                  navTo={`${explorerURL}/accounts/${txn.oldOwner}`}
                />
              )}

              {!!txn?.oldAddress && (
                <TransactionLineItem
                  title={t('transactions.oldAddress')}
                  bodyText={txn.oldAddress}
                  navTo={`${explorerURL}/accounts/${txn.oldAddress}`}
                />
              )}

              {!!txn?.newOwner && (
                <TransactionLineItem
                  title={t('transactions.newOwner')}
                  bodyText={txn.newOwner}
                  navTo={`${explorerURL}/accounts/${txn.newOwner}`}
                />
              )}

              {!!txn?.newAddress && (
                <TransactionLineItem
                  title={t('transactions.newAddress')}
                  bodyText={txn.newAddress}
                  navTo={`${explorerURL}/accounts/${txn.newAddress}`}
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
                  navTo={`${explorerURL}/blocks/${txn?.height}`}
                />
              )}

              <TransactionLineItem
                title={t('transactions.hash')}
                bodyText={txn?.hash || ''}
                navTo={
                  txn?.pending
                    ? `${apiUrl}/pending_transactions/${txn?.hash}`
                    : `${explorerURL}/txns/${txn?.hash}`
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
