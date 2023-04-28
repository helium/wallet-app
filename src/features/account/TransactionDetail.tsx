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
import { LayoutChangeEvent } from 'react-native'
import SafeAreaBox from '@components/SafeAreaBox'
import HandleBasic from '@components/HandleBasic'
import { decodeMemoString, DEFAULT_MEMO } from '@components/MemoInput'
import useBackHandler from '@hooks/useBackHandler'
import BlurBox from '@components/BlurBox'
import TransactionLineItem from './TransactionLineItem'
import { useTxnDetails } from './useTxn'
import { useBalance } from '../../utils/Balance'
import { useCreateExplorerUrl } from '../../constants/urls'
import { ellipsizeAddress } from '../../utils/accountUtils'
import { Activity } from '../../types/activity'

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
  const { handleDismiss, setIsShowing } = useBackHandler(bottomSheetModalRef)

  const { intToBalance } = useBalance()
  const { item: txn } = detailData || {}

  const {
    amount,
    amountTitle,
    color,
    fee,
    feePayer,
    hotspotName,
    icon,
    paymentsReceived,
    paymentsSent,
    time,
    title,
    validatorName,
  } = useTxnDetails(txn)
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

  const rewards = useMemo(() => {
    if (!txn?.rewards?.length || txn.type === 'subnetwork_rewards_v1') {
      return null
    }

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

              {!!hotspotName && (
                <TransactionLineItem
                  title={t('transactions.hotspot')}
                  bodyText={hotspotName}
                  navTo={createExplorerUrl('hotspot', txn?.gateway)}
                />
              )}
              {!!validatorName && (
                <TransactionLineItem
                  title={t('transactions.validator')}
                  bodyText={validatorName}
                  navTo={createExplorerUrl('validator', txn?.gateway)}
                />
              )}

              {!!txn?.buyer && (
                <TransactionLineItem
                  title={t('transactions.buyer')}
                  bodyText={ellipsizeAddress(txn.buyer)}
                  navTo={createExplorerUrl('account', txn.buyer)}
                />
              )}

              {!!txn?.seller && (
                <TransactionLineItem
                  title={t('transactions.seller')}
                  bodyText={ellipsizeAddress(txn.seller)}
                  navTo={createExplorerUrl('account', txn.seller)}
                />
              )}

              {!!txn?.payee && (
                <TransactionLineItem
                  title={t('transactions.payee', { index: '' })}
                  bodyText={txn.payee}
                  isAddress
                  navTo={createExplorerUrl('account', txn.payee)}
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
                    navTo={createExplorerUrl('account', payee)}
                  />
                  {!!memo && memo !== DEFAULT_MEMO && (
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
                        ? createExplorerUrl('account', txn.payer)
                        : undefined
                    }
                  />
                  {!!memo && memo !== DEFAULT_MEMO && (
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
                  navTo={createExplorerUrl('account', txn.owner)}
                />
              )}

              {!!txn?.oldOwner && (
                <TransactionLineItem
                  title={t('transactions.oldOwner')}
                  bodyText={txn.oldOwner}
                  navTo={createExplorerUrl('account', txn.oldOwner)}
                />
              )}

              {!!txn?.oldAddress && (
                <TransactionLineItem
                  title={t('transactions.oldAddress')}
                  bodyText={txn.oldAddress}
                  navTo={createExplorerUrl('account', txn.oldAddress)}
                />
              )}

              {!!txn?.newOwner && (
                <TransactionLineItem
                  title={t('transactions.newOwner')}
                  bodyText={txn.newOwner}
                  navTo={createExplorerUrl('account', txn.newOwner)}
                />
              )}

              {!!txn?.newAddress && (
                <TransactionLineItem
                  title={t('transactions.newAddress')}
                  bodyText={txn.newAddress}
                  navTo={createExplorerUrl('account', txn.newAddress)}
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

export const withTransactionDetail = (Component: FC) => () =>
  (
    <TransactionDetailSelector>
      <Component />
    </TransactionDetailSelector>
  )
