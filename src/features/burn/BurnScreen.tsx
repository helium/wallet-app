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
import QR from '@assets/images/qr.svg'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Balance, { CurrencyType, DataCredits } from '@helium/currency'
import Address, { NetTypes } from '@helium/address'
import { TokenBurnV1 } from '@helium/transactions'
import { useSelector } from 'react-redux'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useColors, useHitSlop } from '@theme/themeHooks'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import AccountButton from '@components/AccountButton'
import SubmitButton from '@components/SubmitButton'
import LedgerBurnModal, {
  LedgerBurnModalRef,
} from '@components/LedgerBurnModal'
import useAlert from '@hooks/useAlert'
import { TXN_FEE_IN_SOL } from '../../utils/solanaUtils'
import { RootState } from '../../store/rootReducer'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import {
  accountNetType,
  ellipsizeAddress,
  formatAccountAlias,
  solAddressIsValid,
} from '../../utils/accountUtils'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAccountQuery, useSubmitTxnMutation } from '../../generated/graphql'
import { balanceToString, useBalance } from '../../utils/Balance'
import PaymentSummary from '../payment/PaymentSummary'
import { useTransactions } from '../../storage/TransactionProvider'
import PaymentSubmit from '../payment/PaymentSubmit'
import { checkSecureAccount } from '../../storage/secureStorage'
import HNTKeyboard, { HNTKeyboardRef } from '../../components/HNTKeyboard'
import IconPressedContainer from '../../components/IconPressedContainer'
import { useAppStorage } from '../../storage/AppStorageProvider'
import PaymentItem from '../payment/PaymentItem'
import AddressBookSelector, {
  AddressBookRef,
} from '../../components/AddressBookSelector'
import { CSAccount } from '../../storage/cloudStorage'
import useSubmitTxn from '../../graphql/useSubmitTxn'

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
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const { submitDelegateDataCredits } = useSubmitTxn()
  const addressBookRef = useRef<AddressBookRef>(null)
  const {
    floatToBalance,
    dcToNetworkTokens,
    networkTokensToDc,
    networkBalance,
    solBalance,
    dcBalance,
  } = useBalance()
  const [fee, setFee] = useState<Balance<DataCredits>>()
  const { makeBurnTxn } = useTransactions()
  const { showOKAlert } = useAlert()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const { l1Network } = useAppStorage()
  const [
    submitTxnMutation,
    { data: submitData, loading: submitLoading, error: submitError },
  ] = useSubmitTxnMutation()
  const [dcAmount, setDcAmount] = useState(
    new Balance(Number(route.params.amount), CurrencyType.dataCredit),
  )
  const [delegateAddress, setDelegateAddress] = useState(route.params.address)
  const [hasError, setHasError] = useState(false)
  const delegatePayment = useSelector(
    (reduxState: RootState) => reduxState.solana.delegate,
  )

  const { isDelegate } = useMemo(() => route.params, [route.params])

  const containerStyle = useMemo(
    () => ({ marginTop: Platform.OS === 'android' ? top : undefined }),
    [top],
  )

  const networkType = useMemo(
    () => accountNetType(route.params.address),
    [route.params.address],
  )

  const handleShowAccounts = useCallback(() => {
    if (!accountSelectorRef?.current) return
    accountSelectorRef.current.showAccountTypes(networkType)()
  }, [networkType])

  const amountBalance = useMemo(() => {
    const amount = parseFloat(route.params.amount)

    if (dcAmount) return dcAmount

    return floatToBalance(amount, 'HNT')
  }, [floatToBalance, dcAmount, route.params.amount])

  const feeAsTokens = useMemo(() => {
    if (l1Network === 'solana')
      return Balance.fromFloat(TXN_FEE_IN_SOL, CurrencyType.solTokens)

    if (!fee) return

    return dcToNetworkTokens(fee)
  }, [dcToNetworkTokens, fee, l1Network])

  const amountInDc = useMemo(() => {
    if (!amountBalance) return
    return networkTokensToDc(amountBalance)
  }, [amountBalance, networkTokensToDc])

  useEffect(() => {
    if (isDelegate) return

    makeBurnTxn({
      payeeB58: route.params.address,
      amount: amountBalance?.integerBalance || 0,
      memo: route.params.memo || '',
      nonce: 1,
      shouldSign: false,
    }).then((b) =>
      setFee(new Balance(b.unsignedTxn.fee, CurrencyType.dataCredit)),
    )
  }, [
    amountBalance,
    isDelegate,
    makeBurnTxn,
    route.params.address,
    route.params.memo,
  ])

  const onTokenItemPressed = useCallback(() => {
    hntKeyboardRef.current?.show({
      payer: currentAccount,
      balance: amountBalance,
    })
  }, [amountBalance, currentAccount])

  useEffect(() => {
    if (currentAccount?.netType === networkType || isDelegate) return

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
    isDelegate,
    navigation.goBack,
    networkType,
    setCurrentAccount,
    showOKAlert,
    sortedAccountsForNetType,
    t,
  ])

  const handleSubmit = useCallback(async () => {
    if (l1Network === 'solana' && isDelegate && amountBalance) {
      submitDelegateDataCredits(delegateAddress, amountBalance.integerBalance)

      return
    }

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
    accountData?.account?.speculativeNonce,
    amountBalance,
    currentAccount,
    delegateAddress,
    isDelegate,
    l1Network,
    makeBurnTxn,
    route.params.address,
    route.params.memo,
    submitDelegateDataCredits,
    submitTxnMutation,
  ])

  const handleQrScan = useCallback(() => {
    navigation.navigate('PaymentQrScanner')
  }, [navigation])

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
    if (!amountBalance || !feeAsTokens) return false

    if (amountBalance.floatBalance > dcBalance.floatBalance) {
      return true
    }

    if (
      l1Network === 'solana' &&
      feeAsTokens.floatBalance > solBalance.floatBalance
    ) {
      return true
    }

    return networkBalance.floatBalance < feeAsTokens.floatBalance
  }, [
    amountBalance,
    dcBalance.floatBalance,
    feeAsTokens,
    l1Network,
    networkBalance.floatBalance,
    solBalance.floatBalance,
  ])

  const errors = useMemo(() => {
    const errStrings: string[] = []
    if (insufficientFunds) {
      errStrings.push(
        t('payment.insufficientFunds', { token: amountBalance?.type.ticker }),
      )
    }

    return errStrings
  }, [amountBalance, insufficientFunds, t])

  const onConfirmBalance = useCallback((opts) => {
    setDcAmount(new Balance(opts.balance.floatBalance, CurrencyType.dataCredit))
  }, [])

  const handleAddressBookSelected = useCallback(
    ({ address, index }: { address?: string | undefined; index: number }) => {
      addressBookRef?.current?.showAddressBook({ address, index })
    },
    [],
  )

  const handleContactSelected = useCallback(
    ({
      contact,
      index,
    }: {
      contact: CSAccount
      prevAddress?: string
      index?: number
    }) => {
      if (index === undefined) return

      const payee =
        l1Network === 'helium' ? contact.address : contact.solanaAddress

      if (!payee) return

      setDelegateAddress(payee)
    },
    [l1Network],
  )

  const handleAddressError = useCallback(
    ({ address }: { address: string }) => {
      let invalidAddress = false

      if (isDelegate) {
        invalidAddress = !!address && !Address.isValid(address)
      } else {
        invalidAddress = !!address && !solAddressIsValid(address)
      }

      const wrongNetType =
        address !== undefined &&
        address !== '' &&
        accountNetType(address) !== networkType

      setHasError(invalidAddress || wrongNetType)
    },
    [networkType, isDelegate],
  )

  if (!amountBalance) return null

  return (
    <HNTKeyboard
      ref={hntKeyboardRef}
      onConfirmBalance={onConfirmBalance}
      ticker={amountBalance?.type.ticker}
      networkFee={Balance.fromFloatAndTicker(TXN_FEE_IN_SOL, 'SOL')}
    >
      <AccountSelector ref={accountSelectorRef}>
        <AddressBookSelector
          ref={addressBookRef}
          onContactSelected={handleContactSelected}
          hideCurrentAccount
        >
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
                <Box hitSlop={hitSlop} padding="s">
                  <IconPressedContainer
                    onPress={handleQrScan}
                    activeOpacity={0.75}
                    idleOpacity={1.0}
                  >
                    <QR color={primaryText} height={16} width={16} />
                  </IconPressedContainer>
                </Box>
                <Text
                  variant="subtitle2"
                  flex={1}
                  textAlign="center"
                  color="primaryText"
                  maxFontSizeMultiplier={1}
                >
                  {t(isDelegate ? 'delegate.title' : 'burn.title')}
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

                {isDelegate && l1Network === 'solana' ? (
                  <PaymentItem
                    index={0}
                    onAddressBookSelected={handleAddressBookSelected}
                    onEditAmount={onTokenItemPressed}
                    onEditAddress={({ address }) => {
                      setDelegateAddress(address)
                      handleAddressError({
                        address,
                      })
                    }}
                    handleAddressError={handleAddressError}
                    ticker={amountBalance?.type.ticker}
                    address={delegateAddress}
                    amount={amountBalance}
                    hasError={hasError}
                    hideMemo
                  />
                ) : (
                  <>
                    <AccountButton
                      backgroundColor="surfaceSecondary"
                      accountIconSize={41}
                      subtitle={t('burn.recipient')}
                      title={ellipsizeAddress(
                        route.params.address || delegateAddress,
                      )}
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
                      <Text
                        variant="body3"
                        marginBottom="m"
                        color="secondaryText"
                      >
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
                      <Text
                        variant="subtitle2"
                        color="primaryText"
                        marginBottom="m"
                      >
                        {amountInDc?.toString()}
                      </Text>

                      <Box
                        height={1}
                        backgroundColor="primaryBackground"
                        marginHorizontal="n_m"
                      />

                      {route.params.memo && (
                        <>
                          <Text
                            variant="body3"
                            color="secondaryText"
                            marginTop="m"
                          >
                            {t('burn.memo')}
                          </Text>
                          <Text variant="body3" marginBottom="m">
                            {route.params.memo}
                          </Text>
                        </>
                      )}
                    </Box>
                  </>
                )}
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
                    disabled={
                      amountBalance.floatBalance === 0 ||
                      hasError ||
                      (!delegateAddress && l1Network === 'solana' && isDelegate)
                    }
                    marginTop="l"
                    title={t(
                      isDelegate ? 'delegate.swipe' : 'burn.swipeToBurn',
                    )}
                    onSubmit={handleSubmit}
                  />
                </Box>
              </Box>
            </Box>
            <PaymentSubmit
              submitLoading={submitLoading || !!delegatePayment?.loading}
              submitSucceeded={
                !!submitData?.submitTxn?.hash || delegatePayment?.success
              }
              submitError={submitError || delegatePayment?.error}
              totalBalance={amountBalance}
              feeTokenBalance={feeAsTokens}
              onRetry={handleSubmit}
              onSuccess={navigation.popToTop}
              actionTitle={t('generic.ok')}
            />
          </LedgerBurnModal>
        </AddressBookSelector>
      </AccountSelector>
    </HNTKeyboard>
  )
}

export default reactMemo(BurnScreen)
