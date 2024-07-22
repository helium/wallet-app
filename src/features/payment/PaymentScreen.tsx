import Close from '@assets/images/close.svg'
import QR from '@assets/images/qr.svg'
import AccountButton from '@components/AccountButton'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import AddressBookSelector, {
  AddressBookRef,
} from '@components/AddressBookSelector'
import Box from '@components/Box'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import IconPressedContainer from '@components/IconPressedContainer'
import Text from '@components/Text'
import TokenButton from '@components/TokenButton'
import TokenSelector, {
  TokenListItem,
  TokenSelectorRef,
} from '@components/TokenSelector'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Address, { NetTypes } from '@helium/address'
import { useMint, useOwnedAmount } from '@helium/helium-react-hooks'
import { DC_MINT, HNT_MINT, truthy } from '@helium/spl-utils'
import useDisappear from '@hooks/useDisappear'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { usePublicKey } from '@hooks/usePublicKey'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useVisibleTokens } from '@storage/TokensProvider'
import { useColors, useHitSlop } from '@theme/themeHooks'
import { Mints } from '@utils/constants'
import { fetchDomainOwner } from '@utils/getDomainOwner'
import {
  calcCreateAssociatedTokenAccountAccountFee,
  humanReadable,
} from '@utils/solanaUtils'
import BN from 'bn.js'
import { unionBy } from 'lodash'
import React, {
  memo as reactMemo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, Platform } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-simple-toast'
import { useSelector } from 'react-redux'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { RootState } from '../../store/rootReducer'
import { solanaSlice } from '../../store/slices/solanaSlice'
import { useAppDispatch } from '../../store/store'
import {
  accountNetType,
  formatAccountAlias,
  solAddressIsValid,
} from '../../utils/accountUtils'
import { SendDetails } from '../../utils/linking'
import * as logger from '../../utils/logger'
import {
  HomeNavigationProp,
  HomeStackParamList,
  PaymentRouteParam,
} from '../home/homeTypes'
import PaymentCard from './PaymentCard'
import PaymentItem from './PaymentItem'
import PaymentSubmit from './PaymentSubmit'
import usePaymentsReducer, { MAX_PAYMENTS } from './usePaymentsReducer'

type LinkedPayment = {
  amount?: string
  payee: string
  mint?: string
  defaultTokenType?: string
}

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

type Route = RouteProp<HomeStackParamList, 'PaymentScreen'>
const PaymentScreen = () => {
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

  const appDispatch = useAppDispatch()
  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('l')

  useDisappear(() => {
    appDispatch(solanaSlice.actions.resetPayment())
  })

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])

  const [paymentState, dispatch] = usePaymentsReducer({
    mint,
    balance,
    netType: networkType,
  })

  useEffect(() => {
    dispatch({
      type: 'updateTokenBalance',
      balance,
    })
  }, [dispatch, balance, mint])

  const { submitPayment } = useSubmitTxn()

  const solanaPayment = useSelector(
    (reduxState: RootState) => reduxState.solana.payment,
  )
  const { symbol } = useMetaplexMetadata(mint)

  const { top } = useSafeAreaInsets()

  useEffect(() => {
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
        Toast.show(t('payment.netTypeQrError'))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    [currentAccount?.address, dispatch],
  )

  const handleQrScan = useCallback(() => {
    navigation.navigate('PaymentQrScanner')
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

  const handleSubmit = useCallback(async () => {
    try {
      await submitPayment(
        paymentState.payments
          .filter((p) => p.address && p.amount)
          .map((payment) => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            payee: payment.address!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            balanceAmount: payment.amount!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            max: payment.max!,
          })),
        paymentState.mint,
      )
    } catch (e) {
      logger.error(e)
    }
  }, [submitPayment, paymentState.mint, paymentState.payments])

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
        handleDomainAddress({ domain: address })?.then((resolvedAddress) => {
          if (resolvedAddress) {
            invalidAddress =
              !!resolvedAddress && !solAddressIsValid(resolvedAddress)

            const wrongNetType = accountNetType(resolvedAddress) !== networkType
            handleSetPaymentError(index, invalidAddress || wrongNetType)
          }
        })
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

  const containerStyle = useMemo(() => {
    // if navigation cannot go back then this is not being presented in a modal so we need top margin
    return {
      marginTop:
        Platform.OS === 'android' || !navigation.canGoBack() ? top : undefined,
    }
  }, [navigation, top])

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
      >
        <AccountSelector ref={accountSelectorRef}>
          <AddressBookSelector
            ref={addressBookRef}
            onContactSelected={handleContactSelected}
            hideCurrentAccount
          >
            <TokenSelector
              ref={tokenSelectorRef}
              onTokenSelected={onTokenSelected}
              tokenData={data}
            >
              <Box
                flex={1}
                style={containerStyle}
                borderTopStartRadius="xl"
                borderTopEndRadius="xl"
                backgroundColor="secondaryBackground"
              >
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                  borderTopStartRadius="xl"
                  borderTopEndRadius="xl"
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
                    textAlign="center"
                    color="primaryText"
                    maxFontSizeMultiplier={1}
                  >
                    {t('payment.send')}
                  </Text>
                  <Box hitSlop={hitSlop} padding="s">
                    <IconPressedContainer
                      onPress={navBack}
                      activeOpacity={0.75}
                      idleOpacity={1.0}
                    >
                      <Close color={primaryText} height={16} width={16} />
                    </IconPressedContainer>
                  </Box>
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
                    showChevron={
                      sortedAccountsForNetType(networkType).length > 1
                    }
                    address={currentAccount?.address}
                    onPress={handleShowAccounts}
                    showBubbleArrow
                    marginHorizontal="l"
                    marginBottom="xs"
                  />

                  <TokenButton
                    backgroundColor="secondary"
                    title={t('payment.title', { ticker: symbol })}
                    subtitle={tokenButtonBalance}
                    address={currentAccount?.address}
                    onPress={handleTokenTypeSelected}
                    showBubbleArrow
                    marginHorizontal="l"
                    mint={mint}
                  />

                  {paymentState.payments.map((p, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <React.Fragment key={index}>
                      <PaymentItem
                        {...p}
                        hideMemo
                        marginTop={index === 0 ? 'xs' : 'none'}
                        marginBottom="l"
                        hasError={
                          p.address === currentAccount?.address || p.hasError
                        }
                        index={index}
                        onAddressBookSelected={handleAddressBookSelected}
                        onEditAmount={handleEditAmount}
                        onToggleMax={handleToggleMax}
                        onEditAddress={handleEditAddress}
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
                    <TouchableOpacityBox
                      minHeight={75}
                      onPress={handleAddPayee}
                      borderRadius="xl"
                      overflow="hidden"
                      marginHorizontal="l"
                      marginBottom="l"
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor="secondary"
                    >
                      <Text variant="body1" color="surfaceSecondaryText">
                        {t('payment.addRecipient')}
                      </Text>
                    </TouchableOpacityBox>
                  )}
                </KeyboardAwareScrollView>

                <PaymentCard
                  mint={mint}
                  totalBalance={paymentState.totalAmount}
                  feeTokenBalance={paymentState.networkFee}
                  disabled={!isFormValid}
                  onSubmit={handleSubmit}
                  payments={payments}
                  errors={errors}
                  handleCancel={navBack}
                />
              </Box>
            </TokenSelector>
          </AddressBookSelector>
        </AccountSelector>
      </HNTKeyboard>
      <PaymentSubmit
        mint={mint}
        submitLoading={!!solanaPayment?.loading}
        submitSucceeded={!!solanaPayment?.success}
        submitError={solanaPayment?.error}
        totalBalance={paymentState.totalAmount}
        payments={paymentState.payments}
        feeTokenBalance={paymentState.networkFee}
        onRetry={handleSubmit}
        onSuccess={navigation.popToTop}
        actionTitle={t('payment.backToAccounts')}
      />
    </>
  )
}

export default reactMemo(PaymentScreen)
