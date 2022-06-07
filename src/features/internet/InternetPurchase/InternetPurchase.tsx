import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  memo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context'
import Balance, { CurrencyType } from '@helium/currency'
import { ActivityIndicator, Platform } from 'react-native'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import { NetTypes as NetType } from '@helium/address'
import {
  CardFieldInput,
  StripeProvider,
  useConfirmPayment,
} from '@stripe/stripe-react-native'
import { ApolloError } from '@apollo/client'
import Box from '../../../components/Box'
import { useColors } from '../../../theme/themeHooks'
import ButtonPressable from '../../../components/ButtonPressable'
import { useAnimateTransition } from '../../../utils/animateTransition'
import { useAccountStorage } from '../../../storage/AccountStorageProvider'
import { useTransactions } from '../../../storage/TransactionProvider'
import useAlert from '../../../utils/useAlert'
import SafeAreaBox from '../../../components/SafeAreaBox'
import { AccountNetTypeOpt } from '../../../utils/accountUtils'
import { balanceToString, useBalance } from '../../../utils/Balance'
import InternetTokenPurchase from './InternetTokenPurchase'
import InternetPurchaseLineItem from './InternetPurchaseLineItem'
import InternetSelectDataAmount from './InternetSelectDataAmount'
import InternetSelectedAmount from './InternetSelectedAmount'
import CountdownTimer, { TimerRef } from '../../../components/CountdownTimer'
import InternetPaymentTab, { PaymentOptions } from './InternetPaymentTab'
import InternetUsdPurchase from './InternetUsdPurchase'
import {
  useAccountQuery,
  useFeatureFlagsQuery,
  useStripeParamsLazyQuery,
  useSubmitTxnMutation,
} from '../../../generated/graphql'
import { checkSecureAccount } from '../../../storage/secureStorage'
import { encodeMemoString } from '../../../components/MemoInput'
import { InternetNavigationProp } from '../internetTypes'
import usePrevious from '../../../utils/usePrevious'
import IOSKeyboardAwareScrollView from '../../../components/IOSKeyboardAwareScrollView'
import useAppear from '../../../utils/useAppear'
import * as Logger from '../../../utils/logger'

const TIMER_SECONDS = 15 * 60 // 15 minutes

const InternetPurchase = () => {
  const { currentAccount } = useAccountStorage()
  const { animate, isAnimating } = useAnimateTransition()

  const { data: flags } = useFeatureFlagsQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    skip: !currentAccount?.address,
  })

  const { makeBurnTxn } = useTransactions()
  const navigation = useNavigation<InternetNavigationProp>()
  const { bottom } = useSafeAreaInsets()
  const { t } = useTranslation()
  const colors = useColors()
  const [viewState, setViewState] = useState<
    'select' | 'hnt' | 'usd' | 'submit_hnt' | 'submit_usd'
  >('select')
  const prevViewState = usePrevious(viewState)
  const [accountsType] = useState<AccountNetTypeOpt>(NetType.TESTNET)
  const [dataIndex, setDataIndex] = useState(0)
  const { showOKAlert } = useAlert()
  const timerRef = useRef<TimerRef>(null)
  const { toCurrencyString, toUsd, accountBalance, dcToTokens, updateVars } =
    useBalance()
  const [currencyString, setCurrencyString] = useState('')
  const [usCents, setUsCents] = useState(0)
  const [creditCardDetails, setCreditCardDetails] =
    useState<CardFieldInput.Details>()

  const [fetchStripeParams, { loading: loadingPaymentIntent }] =
    useStripeParamsLazyQuery()
  const { confirmPayment, loading: loadingPayment } = useConfirmPayment()

  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    skip: !currentAccount?.address,
  })

  const [submitTxnMutation] = useSubmitTxnMutation()

  useEffect(() => {
    changeNavigationBarColor(colors.surfaceSecondary, true, false)
  }, [colors.surfaceSecondary])

  const bottomStyle = useMemo(
    () => ({
      paddingBottom: bottom,
    }),
    [bottom],
  )

  useAppear(() => {
    updatePricing()
  })

  const updatePricing = useCallback(async () => {
    if (!currentAccount) return

    updateVars()
    timerRef.current?.start(TIMER_SECONDS)
  }, [currentAccount, updateVars])

  const dataPrices = useMemo(() => {
    // TODO: Prices are just placeholder for now
    return [
      { val: 1, dcPrice: 10000000 },
      { val: 5, dcPrice: 50000000 },
      { val: 20, dcPrice: 200000000 },
    ]
  }, [])

  const dcCost = useMemo(
    () => new Balance(dataPrices[dataIndex].dcPrice, CurrencyType.dataCredit),
    [dataPrices, dataIndex],
  )

  const tokenCost = useMemo(() => dcToTokens(dcCost), [dcCost, dcToTokens])

  useEffect(() => {
    toCurrencyString(tokenCost).then(setCurrencyString)
    setUsCents(toUsd(tokenCost) * 100)
  }, [toCurrencyString, toUsd, tokenCost])

  const remainingBalance = useMemo(() => {
    if (!accountBalance) return

    if (!tokenCost) return
    return accountBalance.minus(tokenCost)
  }, [accountBalance, tokenCost])

  const tokenPrice = useMemo(() => {
    return balanceToString(tokenCost, {
      maxDecimalPlaces: 4,
    })
  }, [tokenCost])

  const handleAmountChange = useCallback((index: number) => {
    setDataIndex(index)
  }, [])

  const updateViewState = useCallback(
    (val: 'select' | 'usd' | 'hnt' | 'submit_hnt' | 'submit_usd') => () => {
      animate('InternetPurchase.handleNext')
      setViewState(val)
    },
    [animate],
  )

  const handleBurn = useCallback(async () => {
    try {
      if (!currentAccount?.address || !accountData?.account) {
        throw new Error('Account missing data')
      }

      if (!tokenCost) throw Error('Token cost missing')

      const txn = await makeBurnTxn({
        // TODO: Make payee configurable via api. One for testnet, one for mainnet
        payeeB58: flags?.featureFlags.wifiBurnPayee || '',
        amount: tokenCost.integerBalance,
        memo: encodeMemoString(flags?.featureFlags.wifiBurnMemo || '') || '',
        nonce: accountData.account.nonce + 1,
      })
      if (!currentAccount.ledgerDevice) {
        const hasSecureAccount = await checkSecureAccount(
          currentAccount.address,
          true,
        )
        if (!txn.signedTxn || !hasSecureAccount) {
          throw new Error('Failed to sign transaction')
        }

        const variables = {
          address: currentAccount.address,
          txnJson: txn.txnJson,
          txn: txn.signedTxn.toString(),
        }
        const response = await submitTxnMutation({ variables })
        const errMsgs = response.errors?.map((e) => e.message).join('\n')
        if (errMsgs || !response.data) {
          throw new Error(errMsgs || 'Burn txn submission failed')
        }
      } else {
        // TODO: This is testnet for now, but eventually will need to handle ledger
        // Show ledger modal
        // ledgerPaymentRef.current?.show({
        //   unsignedTxn,
        //   ledgerDevice: account.ledgerDevice,
        //   txnJson,
        // })
      }

      navigation.navigate('WifiProfileInstructions')
    } catch (e) {
      Logger.error(e)
      let errStr = ''
      if (typeof e === 'string') {
        errStr = e
      } else if (e instanceof Error) {
        errStr = e.message
      }
      await showOKAlert({
        title: t('internet.burnFailed'),
        message: errStr,
      })
      updateViewState('hnt')()
    }
  }, [
    accountData,
    currentAccount,
    flags,
    makeBurnTxn,
    navigation,
    showOKAlert,
    submitTxnMutation,
    t,
    tokenCost,
    updateViewState,
  ])

  const handlePositiveButtonPress = useCallback(() => {
    switch (viewState) {
      case 'select': {
        updateViewState('hnt')()
        break
      }
      case 'hnt': {
        updateViewState('submit_hnt')()
        break
      }
      case 'usd': {
        updateViewState('submit_usd')()
        break
      }
    }
  }, [updateViewState, viewState])

  const handleStripePayment = useCallback(async () => {
    let error = ''
    try {
      if (!currentAccount) throw new Error('Account missing')

      const { data, error: stripeParamsError } = await fetchStripeParams({
        variables: { address: currentAccount.address, amount: usCents },
      })
      if (!data || stripeParamsError) {
        throw stripeParamsError || new Error('Could not fetch Stripe Params')
      }
      const {
        stripeParams: { paymentSecret },
      } = data

      const stripeResponse = await confirmPayment(paymentSecret, {
        paymentMethodType: 'Card',
      })

      if (stripeResponse?.error?.localizedMessage) {
        throw new Error(stripeResponse.error.localizedMessage)
      }
    } catch (e) {
      Logger.error(e)
      if (e instanceof Error) {
        error = e.toString()
      } else if (e instanceof ApolloError) {
        error = e.message
      }
    }
    if (error) {
      showOKAlert({
        title: t('generic.error'),
        message: error,
      })
      updateViewState('usd')()
      return
    }

    navigation.navigate('WifiProfileInstructions')
  }, [
    confirmPayment,
    currentAccount,
    fetchStripeParams,
    updateViewState,
    navigation,
    showOKAlert,
    t,
    usCents,
  ])

  useEffect(() => {
    if (
      (viewState !== 'submit_hnt' && viewState !== 'submit_usd') ||
      prevViewState === viewState
    ) {
      return
    }

    if (!currentAccount?.address) return
    timerRef.current?.clear()
    if (viewState === 'submit_usd') {
      handleStripePayment()
    } else if (viewState === 'submit_hnt') {
      handleBurn()
    }
  }, [
    currentAccount,
    handleBurn,
    handleStripePayment,
    prevViewState,
    viewState,
  ])

  const hasSufficientAccountBalance = useMemo(() => {
    if (!remainingBalance) return false
    return remainingBalance.integerBalance >= 0
  }, [remainingBalance])

  const submitDisabled = useMemo(() => {
    if (viewState === 'usd') {
      return (
        loadingPayment ||
        loadingPaymentIntent ||
        !creditCardDetails ||
        creditCardDetails.validNumber !== 'Valid' ||
        creditCardDetails.validExpiryDate !== 'Valid' ||
        creditCardDetails.validCVC !== 'Valid'
      )
    }
    return viewState === 'hnt' && !hasSufficientAccountBalance
  }, [
    creditCardDetails,
    hasSufficientAccountBalance,
    loadingPayment,
    loadingPaymentIntent,
    viewState,
  ])

  const positiveButtonText = useMemo(() => {
    if (viewState === 'select' || (isAnimating && Platform.OS === 'android')) {
      // On android updating text while animating leads to layout bugs
      return t('generic.next')
    }
    return t('internet.confirmPayment')
  }, [isAnimating, t, viewState])

  const safeAreaEdges = useMemo(
    (): Edge[] =>
      Platform.OS === 'android' ? ['top', 'left', 'right'] : ['left', 'right'],
    [],
  )

  const isSubmitting = useMemo(
    () => viewState === 'submit_hnt' || viewState === 'submit_usd',
    [viewState],
  )

  return (
    <StripeProvider
      publishableKey={flags?.featureFlags.stripePublishableKey || ''}
    >
      <IOSKeyboardAwareScrollView scrollEnabled={viewState === 'usd'}>
        <SafeAreaBox
          flex={1}
          alignItems="center"
          paddingTop="l"
          edges={safeAreaEdges}
        >
          <InternetSelectDataAmount
            amounts={dataPrices}
            selectedIndex={dataIndex}
            onSelect={handleAmountChange}
            visible={viewState === 'select'}
          />
          <InternetSelectedAmount
            visible={viewState !== 'select'}
            onChange={updateViewState('select')}
            amount={dataPrices[dataIndex].val}
            disabled={viewState === 'submit_hnt' || viewState === 'submit_usd'}
          />

          <CountdownTimer
            flex={1}
            marginTop="ms"
            visible={viewState !== 'select'}
            onExpired={updatePricing}
            ref={timerRef}
          />
          <Box flexDirection="row" width="100%">
            {(viewState === 'hnt' || viewState === 'usd') &&
              PaymentOptions.map((opt) => (
                <InternetPaymentTab
                  option={opt}
                  key={opt}
                  selected={viewState === opt}
                  onPress={updateViewState(opt)}
                />
              ))}
          </Box>

          <Box
            style={bottomStyle}
            width="100%"
            backgroundColor="surfaceSecondary"
            borderTopLeftRadius="xl"
            borderTopRightRadius="xl"
            borderRadius={Platform.OS === 'ios' ? 'xl' : undefined}
          >
            <InternetPurchaseLineItem
              visible={viewState === 'select'}
              paddingVertical="l"
              paddingHorizontal="xl"
              title={t('generic.total')}
              value={currencyString}
              subValue={tokenPrice}
            />

            <InternetTokenPurchase
              currencyString={currencyString}
              accountsType={accountsType}
              tokenCost={tokenCost}
              visible={viewState === 'hnt' || viewState === 'submit_hnt'}
              remainingBalance={remainingBalance}
              hasSufficientBalance={hasSufficientAccountBalance}
            />

            <InternetUsdPurchase
              usd={currencyString}
              visible={viewState === 'usd' || viewState === 'submit_usd'}
              onCardChange={setCreditCardDetails}
            />

            {isSubmitting ? (
              <Box alignItems="center" justifyContent="center" height={60}>
                <ActivityIndicator size={26} color={colors.primaryText} />
              </Box>
            ) : (
              <Box flexDirection="row" paddingHorizontal="xl">
                <ButtonPressable
                  title={t('generic.cancel')}
                  flex={viewState !== 'select' ? undefined : 1}
                  backgroundColor="surface"
                  backgroundColorPressed="surfaceContrast"
                  backgroundColorOpacityPressed={0.08}
                  borderRadius="round"
                  marginRight="s"
                  padding="m"
                  onPress={navigation.goBack}
                />
                <ButtonPressable
                  padding="m"
                  debounceDuration={300}
                  title={positiveButtonText}
                  flex={1}
                  backgroundColor="surfaceContrast"
                  backgroundColorDisabled="surfaceContrast"
                  backgroundColorDisabledOpacity={0.6}
                  titleColor="surfaceContrastText"
                  backgroundColorPressed="surface"
                  titleColorPressed="surfaceText"
                  backgroundColorOpacityPressed={0.08}
                  borderRadius="round"
                  marginLeft="s"
                  onPress={handlePositiveButtonPress}
                  disabled={submitDisabled}
                />
              </Box>
            )}
          </Box>
        </SafeAreaBox>
      </IOSKeyboardAwareScrollView>
    </StripeProvider>
  )
}

export default memo(InternetPurchase)
