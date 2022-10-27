import React, {
  useCallback,
  memo as reactMemo,
  useMemo,
  useEffect,
  useState,
  useRef,
} from 'react'
import { useTranslation } from 'react-i18next'
import Close from '@assets/images/close.svg'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Balance, { CurrencyType, DataCredits } from '@helium/currency'
import { NetTypes } from '@helium/address'
import { TokenBurnV1 } from '@helium/transactions'
import Box from '../../components/Box'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useColors, useHitSlop } from '../../theme/themeHooks'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import {
  accountNetType,
  ellipsizeAddress,
  formatAccountAlias,
} from '../../utils/accountUtils'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAccountSelector } from '../../components/AccountSelector'
import AccountButton from '../../components/AccountButton'
import {
  TokenType,
  useAccountQuery,
  useSubmitTxnMutation,
} from '../../generated/graphql'
import { balanceToString, useBalance } from '../../utils/Balance'
import PaymentSummary from '../payment/PaymentSummary'
import SubmitButton from '../../components/SubmitButton'
import { useTransactions } from '../../storage/TransactionProvider'
import LedgerBurnModal, {
  LedgerBurnModalRef,
} from '../../components/LedgerBurnModal'
import PaymentSubmit from '../payment/PaymentSubmit'
import useAlert from '../../utils/useAlert'
import { checkSecureAccount } from '../../storage/secureStorage'

type Route = RouteProp<HomeStackParamList, 'BurnScreen'>
const BurnScreen = () => {
  const route = useRoute<Route>()
  const {
    accounts,
    currentAccount,
    sortedAccountsForNetType,
    setCurrentAccount,
    defaultAccountAddress,
  } = useAccountStorage()
  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-only',
    skip: !currentAccount?.address,
  })
  const { top } = useSafeAreaInsets()
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const ledgerPaymentRef = useRef<LedgerBurnModalRef>(null)
  const hitSlop = useHitSlop('l')
  const { showAccountTypes } = useAccountSelector()
  const { floatToBalance, dcToNetworkTokens, networkTokensToDc } = useBalance()
  const [fee, setFee] = useState<Balance<DataCredits>>()
  const { makeBurnTxn } = useTransactions()
  const { showOKAlert } = useAlert()
  const [
    submitTxnMutation,
    { data: submitData, loading: submitLoading, error: submitError },
  ] = useSubmitTxnMutation()

  const containerStyle = useMemo(
    () => ({ marginTop: Platform.OS === 'android' ? top : undefined }),
    [top],
  )

  const networkType = useMemo(
    () => accountNetType(route.params.address),
    [route.params.address],
  )

  const handleShowAccounts = useCallback(() => {
    showAccountTypes(networkType)()
  }, [networkType, showAccountTypes])

  const amountBalance = useMemo(() => {
    const amount = parseFloat(route.params.amount)

    return floatToBalance(amount, TokenType.Hnt)
  }, [floatToBalance, route.params.amount])

  const feeAsTokens = useMemo(() => {
    if (!fee) return

    return dcToNetworkTokens(fee)
  }, [dcToNetworkTokens, fee])

  const amountInDc = useMemo(() => {
    if (!amountBalance) return
    return networkTokensToDc(amountBalance)
  }, [amountBalance, networkTokensToDc])

  useEffect(() => {
    makeBurnTxn({
      payeeB58: route.params.address,
      amount: amountBalance?.integerBalance || 0,
      memo: route.params.memo || '',
      nonce: 1,
      shouldSign: false,
    }).then((b) =>
      setFee(new Balance(b.unsignedTxn.fee, CurrencyType.dataCredit)),
    )
  }, [amountBalance, makeBurnTxn, route.params.address, route.params.memo])

  useEffect(() => {
    if (currentAccount?.netType === networkType) return

    const accts = sortedAccountsForNetType(networkType)

    if (!accts.length) {
      // Show error, they don't have any accounts for this net type
      showOKAlert({
        title: t('burn.noAcct.title'),
        message: t('burn.noAcct.message'),
      }).then(navigation.goBack)
      return
    }

    let acct = accts[0]

    const defaultAccount = accounts?.[defaultAccountAddress || '']
    if (defaultAccount?.netType === NetTypes.MAINNET) {
      acct = defaultAccount
    }
    setCurrentAccount(acct)
  }, [
    accounts,
    currentAccount,
    defaultAccountAddress,
    navigation.goBack,
    networkType,
    setCurrentAccount,
    showOKAlert,
    sortedAccountsForNetType,
    t,
  ])

  const handleSubmit = useCallback(async () => {
    if (!amountBalance?.integerBalance || !currentAccount?.address) return

    const { signedTxn, txnJson, unsignedTxn } = await makeBurnTxn({
      payeeB58: route.params.address,
      amount: amountBalance.integerBalance,
      memo: route.params.memo || '',
      nonce: (accountData?.account?.speculativeNonce || 0) + 1,
      shouldSign: !currentAccount?.ledgerDevice,
    })

    if (!currentAccount?.ledgerDevice) {
      const hasSecureAccount = await checkSecureAccount(
        currentAccount.address,
        true,
      )
      if (!signedTxn || !hasSecureAccount) return
      const variables = {
        address: currentAccount?.address,
        txnJson,
        txn: signedTxn.toString(),
      }

      submitTxnMutation({ variables })
    } else {
      // Show ledger modal
      ledgerPaymentRef.current?.show({
        unsignedTxn,
        ledgerDevice: currentAccount.ledgerDevice,
        accountIndex: currentAccount.accountIndex || 0,
        txnJson,
      })
    }
  }, [
    accountData,
    amountBalance,
    currentAccount,
    makeBurnTxn,
    route.params.address,
    route.params.memo,
    submitTxnMutation,
  ])

  const ledgerPaymentConfirmed = useCallback(
    ({ txn: signedTxn, txnJson }: { txn: TokenBurnV1; txnJson: string }) => {
      const variables = {
        address: route.params.address,
        txnJson,
        txn: signedTxn.toString(),
      }

      submitTxnMutation({ variables })
    },
    [route.params.address, submitTxnMutation],
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
      errStrings.push(
        t('payment.insufficientFunds', { token: amountBalance?.type.ticker }),
      )
    }

    return errStrings
  }, [amountBalance, insufficientFunds, t])

  if (!amountBalance) return null

  return (
    <LedgerBurnModal
      ref={ledgerPaymentRef}
      onConfirm={ledgerPaymentConfirmed}
      onError={handleLedgerError}
      title={t('burn.ledger.title')}
      subtitle={t('burn.ledger.subtitle', {
        name: currentAccount?.ledgerDevice?.name,
      })}
    >
      <Box
        backgroundColor="secondaryBackground"
        flex={1}
        style={containerStyle}
      >
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box width={64} />
          <Text
            variant="subtitle2"
            flex={1}
            textAlign="center"
            color="primaryText"
            maxFontSizeMultiplier={1}
          >
            {t('burn.title')}
          </Text>
          <TouchableOpacityBox
            onPress={navigation.goBack}
            width={64}
            padding="l"
            hitSlop={hitSlop}
          >
            <Close color={primaryText} height={16} width={16} />
          </TouchableOpacityBox>
        </Box>

        <KeyboardAwareScrollView
          enableOnAndroid
          enableResetScrollToCoords={false}
          keyboardShouldPersistTaps="always"
        >
          <AccountButton
            backgroundColor="secondary"
            accountIconSize={41}
            paddingTop="l"
            title={formatAccountAlias(currentAccount)}
            subtitle={t('payment.senderAccount')}
            showChevron={sortedAccountsForNetType(networkType).length > 1}
            address={currentAccount?.address}
            netType={currentAccount?.netType}
            onPress={handleShowAccounts}
            showBubbleArrow
            marginHorizontal="l"
            marginBottom="xs"
          />
          <AccountButton
            backgroundColor="secondary"
            accountIconSize={41}
            subtitle={t('burn.recipient')}
            title={ellipsizeAddress(route.params.address)}
            showBubbleArrow
            showChevron={false}
            address={route.params.address}
            netType={networkType}
            marginHorizontal="l"
          />

          <Box
            marginTop="xs"
            marginHorizontal="l"
            backgroundColor="secondary"
            borderRadius="xl"
            paddingHorizontal="m"
            overflow="hidden"
          >
            <Text variant="body3" color="secondaryText" marginTop="m">
              {t('burn.amount')}
            </Text>
            <Text variant="subtitle2" color="primaryText">
              {amountBalance.toString()}
            </Text>
            <Text variant="body3" marginBottom="m" color="secondaryText">
              {t('payment.fee', {
                value: balanceToString(feeAsTokens, {
                  maxDecimalPlaces: 4,
                }),
              })}
            </Text>

            <Box
              height={1}
              backgroundColor="primaryBackground"
              marginHorizontal="n_m"
            />

            <Text variant="body3" color="secondaryText" marginTop="m">
              {t('burn.equivalent')}
            </Text>
            <Text variant="subtitle2" color="primaryText" marginBottom="m">
              {amountInDc?.toString()}
            </Text>

            <Box
              height={1}
              backgroundColor="primaryBackground"
              marginHorizontal="n_m"
            />

            {route.params.memo && (
              <>
                <Text variant="body3" color="secondaryText" marginTop="m">
                  {t('burn.memo')}
                </Text>
                <Text variant="body3" marginBottom="m">
                  {route.params.memo}
                </Text>
              </>
            )}
          </Box>
        </KeyboardAwareScrollView>
        <Box
          borderTopLeftRadius="xl"
          borderTopRightRadius="xl"
          padding="l"
          overflow="hidden"
          minHeight={220}
          backgroundColor="secondary"
        >
          <PaymentSummary
            totalBalance={amountBalance}
            feeTokenBalance={feeAsTokens}
            errors={errors}
          />
          <Box flex={1} justifyContent="flex-end">
            <SubmitButton
              marginTop="l"
              title={t('burn.swipeToBurn')}
              onSubmit={handleSubmit}
            />
          </Box>
        </Box>
      </Box>
      <PaymentSubmit
        submitLoading={submitLoading}
        submitSucceeded={!!submitData?.submitTxn?.hash}
        submitError={submitError}
        totalBalance={amountBalance}
        feeTokenBalance={feeAsTokens}
        onRetry={handleSubmit}
        onSuccess={navigation.popToTop}
        actionTitle={t('generic.ok')}
      />
    </LedgerBurnModal>
  )
}

export default reactMemo(BurnScreen)
