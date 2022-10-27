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
import { NetTypes as NetType } from '@helium/address'
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
import useAlert from '../../utils/useAlert'
import LedgerBurn, { LedgerBurnRef } from '../../components/LedgerBurn'
import { checkSecureAccount } from '../../storage/secureStorage'
import { useAppStorage } from '../../storage/AppStorageProvider'

type Route = RouteProp<VoteNavigatorStackParamList, 'VoteBurn'>
const VoteBurn = () => {
  const {
    params: { voteOutcome, account, memo },
  } = useRoute<Route>()
  const { t } = useTranslation()
  const ledgerPaymentRef = useRef<LedgerBurnRef>(null)
  const navigation = useNavigation<VoteNavigatorNavigationProp>()
  const { colorStyle } = useOpacity('primaryText', 0.3)
  const { dcToNetworkTokens } = useBalance()
  const [fee, setFee] = useState<Balance<DataCredits>>()
  const { makeBurnTxn } = useTransactions()
  const { showOKAlert } = useAlert()
  const { l1Network } = useAppStorage()
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

    return dcToNetworkTokens(fee)
  }, [dcToNetworkTokens, fee])

  const balance = useMemo(() => new Balance(1, CurrencyType.networkToken), [])

  const handleSubmit = useCallback(async () => {
    const { signedTxn, txnJson, unsignedTxn } = await makeBurnTxn({
      payeeB58: voteOutcome.address,
      amount: balance.integerBalance,
      memo,
      nonce: (accountData?.account?.speculativeNonce || 0) + 1,
      shouldSign: !account.ledgerDevice,
    })

    if (!account.ledgerDevice) {
      const hasSecureAccount = await checkSecureAccount(account.address, true)
      if (!signedTxn || !hasSecureAccount) return
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
        accountIndex: account.accountIndex || 0,
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
    if (!accountData?.account?.balance || !feeAsTokens?.integerBalance) {
      return true
    }

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

  if (account.netType !== NetType.MAINNET || l1Network === 'solana') {
    throw new Error('Only helium mainnet supported for voting')
  }

  return (
    <LedgerBurn
      ref={ledgerPaymentRef}
      onConfirm={ledgerPaymentConfirmed}
      onError={handleLedgerError}
      title={t('vote.ledger.title')}
      subtitle={t('vote.ledger.subtitle', {
        name: account.ledgerDevice?.name,
      })}
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
    </LedgerBurn>
  )
}
export default reactMemo(VoteBurn)
