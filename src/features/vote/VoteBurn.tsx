import React, {
  memo as reactMemo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import Balance, { CurrencyType, DataCredits } from '@helium/currency'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { NetType } from '@helium/crypto-react-native'
import { TokenBurnV1 } from '@helium/transactions'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useOpacity } from '../../theme/themeHooks'
import {
  VoteNavigatorNavigationProp,
  VoteNavigatorStackParamList,
} from './voteNavigatorTypes'
import BackButton from '../../components/BackButton'
import AccountButton from '../../components/AccountButton'
import { ellipsizeAddress } from '../../utils/accountUtils'
import { balanceToString, useBalance } from '../../utils/Balance'
import { useAccountQuery, useSubmitTxnMutation } from '../../generated/graphql'
import MemoInput, { getMemoStrValid } from '../../components/MemoInput'
import { useTransactions } from '../../storage/TransactionProvider'
import PaymentSubmit from '../payment/PaymentSubmit'
import BackgroundFill from '../../components/BackgroundFill'
import PaymentSummary from '../payment/PaymentSummary'
import SubmitButton from '../../components/SubmitButton'
import LedgerVote, { LedgerVoteRef } from './LedgerVote'
import useAlert from '../../utils/useAlert'

type Route = RouteProp<VoteNavigatorStackParamList, 'VoteBurn'>
const VoteBurn = () => {
  const {
    params: { voteOutcome, account, memo },
  } = useRoute<Route>()
  const { t } = useTranslation()
  const ledgerPaymentRef = useRef<LedgerVoteRef>(null)
  const navigation = useNavigation<VoteNavigatorNavigationProp>()
  const { colorStyle } = useOpacity('primaryText', 0.3)
  const { dcToTokens } = useBalance()
  const [fee, setFee] = useState<Balance<DataCredits>>()
  const { makeBurnTxn } = useTransactions()
  const { showOKAlert } = useAlert()
  const { data: accountData } = useAccountQuery({
    variables: {
      address: account.address,
    },
    fetchPolicy: 'cache-only',
  })
  const [
    submitTxnMutation,
    { data: submitData, loading: submitLoading, error: submitError },
  ] = useSubmitTxnMutation()

  const accountHnt = useMemo(() => {
    if (!accountData?.account?.balance) return ' '
    return balanceToString(
      new Balance(accountData.account.balance, CurrencyType.networkToken),
      {
        maxDecimalPlaces: 2,
      },
    )
  }, [accountData])

  useEffect(() => {
    makeBurnTxn({
      payeeB58: voteOutcome.address,
      amount: 0,
      memo,
      nonce: 1,
      shouldSign: false,
    }).then((b) =>
      setFee(new Balance(b.unsignedTxn.fee, CurrencyType.dataCredit)),
    )
  }, [account.address, makeBurnTxn, memo, voteOutcome.address])

  const feeAsTokens = useMemo(() => {
    if (!fee) return

    return dcToTokens(fee)
  }, [dcToTokens, fee])

  const balance = useMemo(() => new Balance(0, CurrencyType.networkToken), [])

  const handleSubmit = useCallback(async () => {
    const { signedTxn, txnJson, unsignedTxn } = await makeBurnTxn({
      payeeB58: voteOutcome.address,
      amount: balance.integerBalance,
      memo,
      nonce: (accountData?.account?.speculativeNonce || 0) + 1,
      shouldSign: !account.ledgerDevice,
    })

    if (!account.ledgerDevice) {
      if (!signedTxn) return
      const variables = {
        address: account.address,
        txnJson,
        txn: signedTxn.toString(),
      }

      submitTxnMutation({ variables })
    } else {
      // Show ledger modal
      ledgerPaymentRef.current?.show({
        unsignedTxn,
        ledgerDevice: account.ledgerDevice,
        txnJson,
      })
    }
  }, [
    account,
    accountData,
    balance.integerBalance,
    makeBurnTxn,
    memo,
    submitTxnMutation,
    voteOutcome.address,
  ])

  const ledgerPaymentConfirmed = useCallback(
    ({ txn: signedTxn, txnJson }: { txn: TokenBurnV1; txnJson: string }) => {
      const variables = {
        address: account.address,
        txnJson,
        txn: signedTxn.toString(),
      }

      submitTxnMutation({ variables })
    },
    [account.address, submitTxnMutation],
  )

  const handleLedgerError = useCallback(
    async (error: Error) => {
      await showOKAlert({
        title: t('generic.error'),
        message: error.toString(),
      })
      navigation.goBack()
    },
    [navigation, showOKAlert, t],
  )

  const insufficientFunds = useMemo(() => {
    if (!accountData?.account?.balance || !feeAsTokens?.integerBalance)
      return true

    return accountData.account.balance < feeAsTokens.integerBalance
  }, [accountData, feeAsTokens])

  const errors = useMemo(() => {
    const errStrings: string[] = []
    if (insufficientFunds) {
      errStrings.push(t('payment.insufficientFunds'))
    }

    return errStrings
  }, [insufficientFunds, t])

  const isFormValid = useMemo(() => {
    const memoValid = getMemoStrValid(memo)
    return memoValid && errors.length === 0
  }, [errors.length, memo])

  return (
    <LedgerVote
      ref={ledgerPaymentRef}
      onConfirm={ledgerPaymentConfirmed}
      onError={handleLedgerError}
    >
      <Box flex={1}>
        <Box flexDirection="row" alignItems="center">
          <Box flex={1}>
            <BackButton paddingVertical="l" onPress={navigation.goBack} />
          </Box>
          <Text variant="regular" fontSize={19} color="primaryText">
            {t('vote.burnTitle', { ticker: CurrencyType.networkToken.ticker })}
          </Text>
          <Box flex={1} />
        </Box>

        <KeyboardAwareScrollView
          enableOnAndroid
          enableResetScrollToCoords={false}
          keyboardShouldPersistTaps="always"
        >
          <AccountButton
            paddingTop="xxl"
            title={account.alias}
            subtitle={accountHnt}
            showChevron={false}
            address={account.address}
            netType={NetType.MAINNET}
            showBubbleArrow={false}
            marginHorizontal="l"
          />

          <AccountButton
            paddingTop="l"
            title={voteOutcome.value}
            subtitle={ellipsizeAddress(voteOutcome.address)}
            showChevron={false}
            address={voteOutcome.address}
            netType={NetType.MAINNET}
            showBubbleArrow={false}
            marginHorizontal="l"
          />

          <Box
            marginTop="l"
            marginHorizontal="l"
            backgroundColor="secondary"
            borderRadius="xl"
            overflow="hidden"
            minHeight={145}
          >
            <Box flex={1} justifyContent="center">
              <Text
                paddingHorizontal="m"
                variant="subtitle2"
                color="primaryText"
              >
                0
              </Text>
              {fee && (
                <Text paddingHorizontal="m" variant="body3" style={colorStyle}>
                  {t('payment.fee', {
                    value: balanceToString(feeAsTokens, {
                      maxDecimalPlaces: 4,
                    }),
                  })}
                </Text>
              )}
            </Box>
            <Box height={1} backgroundColor="primaryBackground" />

            <MemoInput flex={1} value={memo} />
          </Box>
        </KeyboardAwareScrollView>

        <Box
          borderTopLeftRadius="xl"
          borderTopRightRadius="xl"
          padding="l"
          overflow="hidden"
          minHeight={220}
        >
          <BackgroundFill backgroundColor="secondary" opacity={0.4} />

          <PaymentSummary
            totalBalance={balance}
            feeTokenBalance={feeAsTokens}
            errors={errors}
          />
          <Box flex={1} justifyContent="flex-end">
            <SubmitButton
              disabled={!isFormValid}
              marginTop="l"
              title={t('vote.swipeToVote')}
              onSubmit={handleSubmit}
            />
          </Box>
        </Box>
      </Box>
      <PaymentSubmit
        submitLoading={submitLoading}
        submitSucceeded={!!submitData?.submitTxn?.hash}
        submitError={submitError}
        totalBalance={balance}
        feeTokenBalance={feeAsTokens}
        onRetry={handleSubmit}
        onSuccess={navigation.popToTop}
        actionTitle={t('vote.backToVoting')}
      />
    </LedgerVote>
  )
}
export default reactMemo(VoteBurn)
