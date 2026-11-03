import { AccountButton } from '@ui/AccountButton'
import { AccountSelector, type AccountSelectorRef } from '@ui/AccountSelector'
import {
  type AddressBookRef,
  AddressBookSelector,
} from '@ui/AddressBookSelector'
import { HNTKeyboard, type HNTKeyboardRef } from '@ui/HNTKeyboard'
import { TokenButton } from '@ui/TokenButton'
import {
  type TokenListItem,
  TokenSelector,
  type TokenSelectorRef,
} from '@ui/TokenSelector'
import Address, { NetTypes } from '@helium/address'
import { useMint, useOwnedAmount } from '@helium/helium-react-hooks'
import { DC_MINT, HNT_MINT, truthy } from '@helium/spl-utils'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useVisibleTokens } from '@storage/TokensProvider'
import { PressableScale } from '@ui/PressableScale'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { Text } from '@ui/Text'
import { Mints } from '@utils/constants'
import { fetchDomainOwner } from '@utils/getDomainOwner'
import {
  calcCreateAssociatedTokenAccountAccountFee,
  humanReadable,
} from '@utils/solanaUtils'
import BN from 'bn.js'
import { unionBy } from 'lodash'
import { QrCode, X } from 'lucide-react-native'
import React, {
  memo as reactMemo,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-simple-toast'
import { withUniwind } from 'uniwind'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { useTransactionBatchStatus } from '../../hooks/useTransactionBatchStatus'
import { navigateToHomeScreen } from '../../navigation/NavigationHelper'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import {
  accountNetType,
  formatAccountAlias,
  solAddressIsValid,
} from '../../utils/accountUtils'
import { SendDetails } from '../../utils/linking'
import * as logger from '../../utils/logger'
import { isUnsentRejection } from '../../utils/submitFailure'
import { UnconfirmedSubmitError } from '../../utils/unconfirmedSubmitError'
import {
  HomeNavigationProp,
  HomeStackParamList,
  PaymentRouteParam,
} from '../home/homeTypes'
import { batchFailure, checkActivity } from './logic/batchFailure'
import { paymentTransactions } from './logic/paymentTransactions'
import { retrySet } from './logic/retrySet'
import PaymentCard from './PaymentCard'
import PaymentItem from './PaymentItem'
import PaymentSubmit from './PaymentSubmit'
import usePaymentsReducer, {
  MAX_PAYMENTS,
  paymentsSum,
} from './usePaymentsReducer'

type LinkedPayment = {
  amount?: string
  payee: string
  mint?: string
  defaultTokenType?: string
}

const QrIcon = withUniwind(QrCode)
const CloseIcon = withUniwind(X)

const parseLinkedPayments = (opts: PaymentRouteParam): LinkedPayment[] => {
  if (opts.payments) {
    return JSON.parse(opts.payments).map((p: LinkedPayment) => ({
      ...p,
      mint:
        p.mint ||
        (p.defaultTokenType && Mints[p.defaultTokenType.toUpperCase()]),
    }))
  }
  if (opts.payee) {
    return [
      {
        payee: opts.payee,
        amount: opts.amount,
        mint:
          opts.mint ||
          (opts.defaultTokenType && Mints[opts.defaultTokenType.toUpperCase()]),
      },
    ]
  }
  return []
}

type PaymentInput = Parameters<
  ReturnType<typeof useSubmitTxn>['submitPayment']
>[0][number]

type Route = RouteProp<HomeStackParamList, 'PaymentScreen'>
const PaymentScreen = () => {
  // Opt out: compiler cannot destructure context variables, see handleEditAddress
  'use no memo'

  const route = useRoute<Route>()
  const addressBookRef = useRef<AddressBookRef>(null)
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const { visibleTokens } = useVisibleTokens()
  const inputMint = usePublicKey(route.params?.mint)
  const [mint, setMint] = useState<PublicKey>(inputMint || HNT_MINT)
  const {
    currentAccount,
    currentNetworkAddress,
    accounts,
    contacts,
    setCurrentAccount,
    sortedAccountsForNetType,
  } = useAccountStorage()
  const wallet = usePublicKey(currentAccount?.solanaAddress)
  const { amount: solBalance } = useOwnedAmount(wallet, NATIVE_MINT)
  const { amount: balanceBigint } = useOwnedAmount(wallet, mint)
  const balanceBigIntInclSol = useMemo(
    () => (mint?.equals(NATIVE_MINT) ? solBalance : balanceBigint),
    [mint, balanceBigint, solBalance],
  )
  const balance = useMemo(() => {
    if (typeof balanceBigIntInclSol !== 'undefined') {
      return new BN(balanceBigIntInclSol.toString())
    }
  }, [balanceBigIntInclSol])
  const { anchorProvider, connection } = useSolana()

  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { t } = useTranslation()
  const hitSlop = 24

  const navBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else if (rootNav.canGoBack()) {
      rootNav.goBack()
    } else {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'TabBarNavigator' }],
      })
    }
  }, [navigation, rootNav])

  const networkType = useMemo(() => {
    if (!route.params || !route.params.payer) {
      return accountNetType(currentAccount?.address)
    }

    const linkedPayments = parseLinkedPayments(route.params)
    if (!linkedPayments?.length) return accountNetType()

    return accountNetType(linkedPayments[0].payee)
  }, [route.params, currentAccount?.address])

  const [paymentState, dispatch] = usePaymentsReducer({
    mint,
    balance,
    netType: networkType,
  })

  // Keyboard Max must reserve the rent-exempt minimum on SOL sends, matching
  // the reducer's recalculate
  const solMinTokens = useMemo(
    () =>
      mint?.equals(NATIVE_MINT)
        ? new BN(paymentState.rentExemptLamports)
        : undefined,
    [mint, paymentState.rentExemptLamports],
  )

  useEffect(() => {
    dispatch({
      type: 'updateTokenBalance',
      balance,
    })
  }, [dispatch, balance, mint])

  const { submitPayment, paymentMutation } = useSubmitTxn()
  const { symbol } = useMetaplexMetadata(mint)

  // Track batchId when mutation succeeds - only show loading after submission
  const batchId = paymentMutation.data?.batchId
  const {
    status,
    transactions,
    isLoading: batchLoading,
  } = useTransactionBatchStatus(batchId || null)

  // Only show loading after we have a batchId (transaction submitted)
  const isSubmitting = batchId ? batchLoading || status === 'pending' : false

  const { top } = useSafeAreaInsets()

  const onTokenSelected = useCallback(
    (m: PublicKey) => {
      setMint(m)

      dispatch({
        type: 'changeToken',
        mint: m,
      })
    },
    [dispatch],
  )

  const handleDeepLink = useEffectEvent(() => {
    if (!route.params) return

    // Deep link handling
    const {
      params: { payer },
    } = route
    const payerAccount = accounts?.[payer || '']
    if (payerAccount) {
      setCurrentAccount(payerAccount)
    } else {
      // Deep link didnt specify a payer
      const acctsForNetType = sortedAccountsForNetType(networkType)
      if (!acctsForNetType.length) {
        // They don't have an account that can handle a payment for this network type
        Toast.show(t('payment.netTypeQrError'), Toast.SHORT)
        navBack()
        return
      }
      if (!currentAccount || currentAccount.netType !== networkType) {
        // If an account of the same netType isn't already selected, set selected account to the first for the net type
        const [firstAcct] = acctsForNetType
        setCurrentAccount(firstAcct)
      }
    }

    const paymentsArr = parseLinkedPayments(route.params)

    if (!paymentsArr?.length) return

    if (paymentsArr[0].mint) {
      onTokenSelected(new PublicKey(paymentsArr[0].mint))
    }

    if (paymentsArr.find((p) => !solAddressIsValid(p.payee))) {
      console.error('Invalid address found in deep link')
      return
    }

    dispatch({
      type: 'addLinkedPayments',
      payments: paymentsArr.map((p) => {
        const contact = contacts.find(
          ({ address, solanaAddress }) =>
            address === p.payee || solanaAddress === p.payee,
        )
        return {
          address: p.payee,
          account: contact,
          amount: p.amount,
        }
      }),
    })
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link handler with side effects (toast, navigation, account switch) that sets the token mint when the route params change
    handleDeepLink()
  }, [route])

  const handleBalance = useCallback(
    (opts: { balance: BN; max: boolean; payee?: string; index?: number }) => {
      if (opts.index === undefined || !currentAccount?.address) return

      dispatch({
        type: 'updateBalance',
        value: opts.balance,
        max: opts.max,
        address: opts.payee,
        index: opts.index,
        payer: currentAccount.address,
      })
    },
    [currentAccount, dispatch],
  )

  const handleQrScan = useCallback(() => {
    navigateToHomeScreen(navigation, 'PaymentQrScanner')
  }, [navigation])

  const canAddPayee = useMemo(() => {
    if (currentAccount?.ledgerDevice) {
      // Only single payee is supported for ledger devices
      return false
    }
    const lastPayee = paymentState.payments[paymentState.payments.length - 1]

    return (
      paymentState.payments.length < MAX_PAYMENTS &&
      !!lastPayee.address &&
      !!lastPayee.amount &&
      lastPayee.amount?.gt(new BN(0))
    )
  }, [currentAccount?.ledgerDevice, paymentState.payments])

  const payments = useMemo(
    (): Array<SendDetails> =>
      paymentState.payments.flatMap((p) => {
        if (!p.address || !p.amount) return []
        return [
          {
            payee: p.address,
            balanceAmount: p.amount,
            max: p.max,
          },
        ]
      }),
    [paymentState.payments],
  )

  const submitting = useRef(false)
  const submitPayments = useCallback(
    async (toPay: PaymentInput[], paymentMint: PublicKey) => {
      if (submitting.current) return
      submitting.current = true
      // Reset mutation state on retry
      paymentMutation.reset()
      try {
        await submitPayment(toPay, paymentMint)
      } catch (e) {
        logger.error(e)
      } finally {
        submitting.current = false
      }
    },
    [submitPayment, paymentMutation],
  )

  // What the last Retry was sending, so a Retry after it failed sends the
  // same set and never a payment a settled batch reported landed.
  const [unsent, setUnsent] = useState<{
    payments: PaymentInput[]
    mint: PublicKey
  }>()

  const allPayments = useMemo(
    () =>
      paymentState.payments
        .filter((p) => p.address && p.amount)
        .map((payment) => ({
          payee: payment.address!,
          balanceAmount: payment.amount!,
          max: payment.max!,
        })),
    [paymentState.payments],
  )

  const handleSubmit = useCallback(() => {
    setUnsent(undefined)
    return submitPayments(allPayments, paymentState.mint)
  }, [submitPayments, allPayments, paymentState.mint])

  // After a failed batch, Retry resends only the payments that did not land,
  // and is not offered when the app cannot tell which did: a submit with no
  // answer may have landed them all.
  const { data: sent, variables: sentWith, error: sendError } = paymentMutation
  const unconfirmed = sendError instanceof UnconfirmedSubmitError
  const unsentRejection = isUnsentRejection(sendError)
  const failure = useMemo(() => {
    if (unconfirmed) return checkActivity<PaymentInput>()
    return sent && sentWith
      ? batchFailure(
          status,
          transactions,
          paymentTransactions(sent.payments, sentWith.mint, sent.transactions),
        )
      : undefined
  }, [unconfirmed, sent, sentWith, status, transactions])
  const toRetry = useMemo(
    () => retrySet(failure, unsent?.payments, allPayments),
    [failure, unsent, allPayments],
  )
  // The mint the retried payments were sent in: the failed batch's, else the
  // failed Retry's, else the form's.
  const retryMint =
    failure && sentWith ? sentWith.mint : (unsent?.mint ?? paymentState.mint)
  const handleRetry = useMemo(
    () =>
      toRetry &&
      (() => {
        setUnsent({ payments: toRetry, mint: retryMint })
        void submitPayments(toRetry, retryMint).catch(console.error)
      }),
    [toRetry, retryMint, submitPayments],
  )

  // Show the amounts actually submitted — the server-priced priority fee may
  // have shaved the max SOL payment.
  const submittedPayments = useMemo(() => {
    const shavedMax = paymentMutation.data?.payments.find((p) => p.max)
    if (!shavedMax) return paymentState.payments
    return paymentState.payments.map((p) =>
      p.max ? { ...p, amount: shavedMax.balanceAmount } : p,
    )
  }, [paymentMutation.data, paymentState.payments])
  const submittedTotal = useMemo(
    () => paymentsSum(submittedPayments),
    [submittedPayments],
  )

  const insufficientFunds = useMemo((): [
    value: boolean,
    errorMint: PublicKey | undefined,
  ] => {
    if (paymentState.balance.isZero()) {
      return [true, undefined]
    }
    if (typeof paymentState.networkFee === 'undefined')
      return [false, undefined]
    try {
      let hasEnoughSol = false
      if (solBalance) {
        hasEnoughSol = new BN(solBalance.toString())
          .sub(paymentState.networkFee)
          .gte(new BN(0))
      }
      const hasEnoughToken = balance
        ?.sub(paymentState.totalAmount)
        .gte(new BN(0))

      if (!hasEnoughSol) return [true, NATIVE_MINT]
      if (!hasEnoughToken) return [true, mint]
      return [false, undefined]
    } catch (e) {
      // if the screen was already open, then a deep link of a different net type
      // is selected there will be a brief arithmetic error that can be ignored.
      if (__DEV__) {
        console.warn(e)
      }
      return [false, undefined]
    }
  }, [
    paymentState.balance,
    paymentState.networkFee,
    paymentState.totalAmount,
    solBalance,
    balance,
    mint,
  ])

  const selfPay = useMemo(
    () =>
      paymentState.payments.find((p) => p.address === currentNetworkAddress),
    [currentNetworkAddress, paymentState.payments],
  )

  const wrongNetTypePay = useMemo(
    () =>
      paymentState.payments.find((p) => {
        if (!p.address || !Address.isValid(p.address)) return false
        return accountNetType(p.address) !== currentAccount?.netType
      }),
    [currentAccount?.netType, paymentState.payments],
  )

  const errors = useMemo(() => {
    const errStrings: string[] = []

    if (!!currentAccount?.ledgerDevice && paymentState.payments.length > 1) {
      // ledger payments are limited to one payee
      errStrings.push(t('payment.ledgerTooManyRecipients'))
    }
    if (insufficientFunds[0]) {
      errStrings.push(
        t('payment.insufficientFunds', {
          token: insufficientFunds[1]?.equals(NATIVE_MINT) ? 'SOL' : symbol,
        }),
      )
    }

    if (selfPay) {
      errStrings.push(t('payment.selfPay'))
    }

    if (wrongNetTypePay) {
      errStrings.push(t('payment.wrongNetType'))
    }
    return errStrings
  }, [
    currentAccount?.ledgerDevice,
    paymentState.payments.length,
    insufficientFunds,
    selfPay,
    wrongNetTypePay,
    t,
    symbol,
  ])

  const isFormValid = useMemo(() => {
    if (selfPay || !paymentState.networkFee) {
      return false
    }

    const paymentsValid =
      paymentState.payments.length &&
      paymentState.payments.every((p) => {
        const addressValid = !!(p.address && solAddressIsValid(p.address))

        const paymentValid = p.amount && p.amount?.gt(new BN(0))
        return addressValid && paymentValid && !p.hasError
      })

    return paymentsValid && !insufficientFunds[0]
  }, [selfPay, paymentState, insufficientFunds])

  const handleTokenTypeSelected = useCallback(() => {
    tokenSelectorRef?.current?.showTokens()
  }, [])

  const handleAddressBookSelected = useCallback(
    ({ address, index }: { address?: string | undefined; index: number }) => {
      addressBookRef?.current?.showAddressBook({ address, index })
    },
    [],
  )

  const handleEditAmount = useCallback(
    ({ address, index }: { address?: string; index: number }) => {
      Keyboard.dismiss()
      hntKeyboardRef.current?.show({
        payer: currentAccount,
        payee: address,
        balance: paymentState.payments[index].amount,
        index,
        payments: paymentState.payments,
      })
    },
    [currentAccount, paymentState.payments],
  )

  const handleToggleMax = useCallback(
    ({ index }: { index: number }) => {
      dispatch({ type: 'toggleMax', index })
    },
    [dispatch],
  )

  const handleRemove = useCallback(
    (index: number) => {
      dispatch({ type: 'removePayment', index })
    },
    [dispatch],
  )

  const handleSetPaymentError = useCallback(
    (index: number, hasError: boolean) => {
      if (index === undefined) return

      dispatch({
        type: 'updateError',
        index,
        hasError,
      })
    },
    [dispatch],
  )

  const handleDomainAddress = useCallback(
    async ({ domain }: { domain: string }) => {
      if (!connection) return
      return fetchDomainOwner(connection, domain)
    },
    [connection],
  )

  const handleAddressError = useCallback(
    ({
      index,
      address,
      isHotspotOrValidator,
    }: {
      index: number
      address: string
      isHotspotOrValidator: boolean
    }) => {
      if (isHotspotOrValidator) {
        handleSetPaymentError(index, true)
        return
      }
      let invalidAddress = false

      // only handle address which include dots.
      if (address && address.split('.').length === 2 && handleDomainAddress) {
        // we have to revalidate.
        void handleDomainAddress({ domain: address })?.then(
          (resolvedAddress) => {
            if (resolvedAddress) {
              invalidAddress =
                !!resolvedAddress && !solAddressIsValid(resolvedAddress)

              const wrongNetType =
                accountNetType(resolvedAddress) !== networkType
              handleSetPaymentError(index, invalidAddress || wrongNetType)
            }
          },
        )
      }
      invalidAddress = !!address && !solAddressIsValid(address)

      const wrongNetType =
        address !== undefined &&
        address !== '' &&
        accountNetType(address) !== networkType
      handleSetPaymentError(index, invalidAddress || wrongNetType)
    },
    [handleSetPaymentError, networkType, handleDomainAddress],
  )

  const handleEditAddress = useCallback(
    async ({ index, address }: { index: number; address: string }) => {
      if (index === undefined || !currentAccount || !anchorProvider || !mint)
        return
      let domain
      if (address.split('.').length === 2) {
        const resolvedAddress =
          (await handleDomainAddress({ domain: address })) || ''
        if (resolvedAddress) {
          // if the address is resolved then the domain could also be an alias/nickname of the address.
          domain = address
          /* eslint-disable-next-line no-param-reassign */
          address = resolvedAddress
        }
      }
      const allAccounts = unionBy(
        contacts,
        Object.values(accounts || {}),
        ({ address: addr }) => addr,
      )
      let contact = allAccounts.find(
        (c) => c.solanaAddress && c.solanaAddress === address,
      )
      if (!contact)
        contact = { address, netType: networkType, alias: domain || '' }

      const createTokenAccountFee =
        await calcCreateAssociatedTokenAccountAccountFee(
          anchorProvider,
          address,
          new PublicKey(mint),
        )

      dispatch({
        type: 'updatePayee',
        index,
        address,
        contact,
        payer: currentAccount?.address,
        createTokenAccountFee,
      })
    },
    [
      accounts,
      contacts,
      currentAccount,
      dispatch,
      networkType,
      anchorProvider,
      mint,
      handleDomainAddress,
    ],
  )

  const handleContactSelected = useCallback(
    async ({
      contact,
      index,
    }: {
      contact: CSAccount
      prevAddress?: string
      index?: number
    }) => {
      if (index === undefined || !currentNetworkAddress || !mint) return

      const payee = contact.solanaAddress
      const payer = currentNetworkAddress

      if (!payee || !payer || !anchorProvider) return

      const createTokenAccountFee =
        await calcCreateAssociatedTokenAccountAccountFee(
          anchorProvider,
          payee,
          new PublicKey(mint),
        )

      dispatch({
        type: 'updatePayee',
        contact,
        index,
        address: payee,
        payer,
        createTokenAccountFee,
      })
    },
    [currentNetworkAddress, dispatch, anchorProvider, mint],
  )

  const handleAddPayee = useCallback(() => {
    dispatch({ type: 'addPayee' })
  }, [dispatch])

  // Every stack shows Send as a full-screen card, so clear the status bar.
  const containerStyle = useMemo(() => ({ marginTop: top }), [top])

  const handleShowAccounts = useCallback(() => {
    if (!accountSelectorRef?.current) return

    let accts = [] as CSAccount[]
    accts = sortedAccountsForNetType(NetTypes.MAINNET)
    if (accts.length < 2) return

    const netType = NetTypes.MAINNET

    accountSelectorRef?.current.showAccountTypes(netType)()
  }, [sortedAccountsForNetType])

  const decimals = useMint(mint)?.info?.decimals
  const tokenButtonBalance = useMemo(() => {
    return humanReadable(balance, decimals)
  }, [balance, decimals])

  const data = useMemo((): TokenListItem[] => {
    const tokens = [...visibleTokens]
      .filter(truthy)
      .filter((vt: string) => vt !== DC_MINT.toBase58())
      .map((token) => ({
        mint: new PublicKey(token),
        selected: mint.toBase58() === token,
      }))
    return tokens
  }, [mint, visibleTokens])

  return (
    <>
      <HNTKeyboard
        ref={hntKeyboardRef}
        onConfirmBalance={handleBalance}
        mint={mint}
        networkFee={paymentState.networkFee}
        minTokens={solMinTokens}
      >
        <AccountSelector ref={accountSelectorRef}>
          <AddressBookSelector
            ref={addressBookRef}
            onContactSelected={(selection) =>
              void handleContactSelected(selection).catch(console.error)
            }
            hideCurrentAccount
          >
            <TokenSelector
              ref={tokenSelectorRef}
              onTokenSelected={onTokenSelected}
              tokenData={data}
            >
              <View
                className="flex-1 rounded-t-[20px] bg-secondary"
                style={containerStyle}
              >
                <View className="flex-row items-center justify-between rounded-t-[20px] px-2">
                  <PressableScale
                    feedback="opacity"
                    hitSlop={hitSlop}
                    className="p-2"
                    onPress={handleQrScan}
                  >
                    <QrIcon colorClassName="accent-foreground" size={16} />
                  </PressableScale>
                  <Text
                    size="lg"
                    className="text-center font-medium"
                    maxFontSizeMultiplier={1}
                  >
                    {t('payment.send')}
                  </Text>
                  <PressableScale
                    feedback="opacity"
                    hitSlop={hitSlop}
                    className="p-2"
                    onPress={navBack}
                  >
                    <CloseIcon colorClassName="accent-foreground" size={16} />
                  </PressableScale>
                </View>

                <KeyboardAwareScrollView
                  contentInsetAdjustmentBehavior="automatic"
                  bottomOffset={75}
                  disableScrollOnKeyboardHide
                  keyboardShouldPersistTaps="always"
                >
                  <AccountButton
                    backgroundClassName="bg-card shadow-stat-box"
                    accountIconSize={41}
                    title={formatAccountAlias(currentAccount)}
                    subtitle={t('payment.senderAccount')}
                    showChevron={
                      sortedAccountsForNetType(networkType).length > 1
                    }
                    address={currentAccount?.address}
                    onPress={handleShowAccounts}
                    showBubbleArrow
                    className="pt-6 mx-4 mb-1"
                  />

                  <TokenButton
                    backgroundClassName="bg-card shadow-stat-box"
                    title={t('payment.title', { ticker: symbol })}
                    subtitle={tokenButtonBalance}
                    address={currentAccount?.address}
                    onPress={handleTokenTypeSelected}
                    showBubbleArrow
                    mint={mint}
                    className="mx-4"
                  />

                  {paymentState.payments.map((p, index) => (
                    <React.Fragment key={index}>
                      <PaymentItem
                        {...p}
                        hideMemo
                        className={
                          index === 0
                            ? 'mx-4 mb-6 mt-1 rounded-2xl'
                            : 'mx-4 mb-6 rounded-2xl'
                        }
                        hasError={
                          p.address === currentAccount?.address || p.hasError
                        }
                        index={index}
                        onAddressBookSelected={handleAddressBookSelected}
                        onEditAmount={handleEditAmount}
                        onToggleMax={handleToggleMax}
                        onEditAddress={(edit) =>
                          void handleEditAddress(edit).catch(console.error)
                        }
                        handleAddressError={handleAddressError}
                        onUpdateError={handleSetPaymentError}
                        mint={mint}
                        onRemove={
                          paymentState.payments.length > 1
                            ? handleRemove
                            : undefined
                        }
                        netType={networkType}
                        showAmount
                      />
                    </React.Fragment>
                  ))}
                  {canAddPayee && (
                    <PressableScale
                      feedback="opacity"
                      onPress={handleAddPayee}
                      className="mx-4 mb-6 min-h-[75px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-card"
                    >
                      <Text size="base" className="text-muted-foreground">
                        {t('payment.addRecipient')}
                      </Text>
                    </PressableScale>
                  )}
                </KeyboardAwareScrollView>

                <TabSafeAreaView edges={['bottom']}>
                  <PaymentCard
                    mint={mint}
                    totalBalance={paymentState.totalAmount}
                    feeTokenBalance={paymentState.networkFee}
                    disabled={!isFormValid || paymentMutation.isPending}
                    onSubmit={() => void handleSubmit().catch(console.error)}
                    payments={payments}
                    errors={errors}
                    handleCancel={navBack}
                  />
                </TabSafeAreaView>
              </View>
            </TokenSelector>
          </AddressBookSelector>
        </AccountSelector>
      </HNTKeyboard>
      <PaymentSubmit
        mint={mint}
        submitLoading={isSubmitting || unconfirmed || unsentRejection}
        submitSucceeded={status === 'confirmed'}
        submitError={paymentMutation.error || failure?.error}
        totalBalance={submittedTotal}
        payments={submittedPayments}
        feeTokenBalance={paymentState.networkFee}
        onRetry={handleRetry}
        onSuccess={navigation.popToTop}
        actionTitle={t('payment.backToAccounts')}
      />
    </>
  )
}

export default reactMemo(PaymentScreen)
