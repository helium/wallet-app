import { AccountButton } from '@ui/AccountButton'
import { AccountSelector, type AccountSelectorRef } from '@ui/AccountSelector'
import { SubmitButton } from '@ui/SubmitButton'
import { TokenButton } from '@ui/TokenButton'
import {
  type TokenListItem,
  TokenSelector,
  type TokenSelectorRef,
} from '@ui/TokenSelector'
import Address, { NetTypes } from '@helium/address'
import { useOwnedAmount, useSolOwnedAmount } from '@helium/helium-react-hooks'
import {
  DC_MINT,
  IOT_MINT,
  MOBILE_MINT,
  humanReadable,
} from '@helium/spl-utils'
import useAlert from '@hooks/useAlert'
import { useBN } from '@hooks/useBN'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PublicKey } from '@solana/web3.js'
import { useHitSlop } from '@theme/themeHooks'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { BN } from 'bn.js'
import { QrCode, X } from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import {
  Edge,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import {
  type AddressBookRef,
  AddressBookSelector,
} from '@ui/AddressBookSelector'
import { HNTKeyboard, type HNTKeyboardRef } from '@ui/HNTKeyboard'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { useTransactionBatchStatus } from '../../hooks/useTransactionBatchStatus'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { CSAccount } from '../../storage/cloudStorage'
import { useBalance } from '../../utils/Balance'
import {
  accountNetType,
  ellipsizeAddress,
  formatAccountAlias,
  solAddressIsValid,
} from '../../utils/accountUtils'
import { TXN_FEE_IN_SOL } from '../../utils/solanaUtils'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import { batchFailure } from '../payment/logic/batchFailure'
import { retrySet } from '../payment/logic/retrySet'
import PaymentItem from '../payment/PaymentItem'
import PaymentSubmit from '../payment/PaymentSubmit'
import PaymentSummary from '../payment/PaymentSummary'

const FEE = new BN(TXN_FEE_IN_SOL)
const SafeArea = withUniwind(SafeAreaView)
const QrIcon = withUniwind(QrCode)
const CloseIcon = withUniwind(X)

const errorMessage = (e: unknown) => (e as Error)?.message

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
  const { top } = useSafeAreaInsets()
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const hitSlop = useHitSlop('l')
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const { submitDelegateDataCredits, delegateDataCreditsMutation } =
    useSubmitTxn()

  // Track batchId when mutation succeeds - only show loading after submission
  const batchId = delegateDataCreditsMutation.data
  const {
    status,
    transactions,
    isLoading: batchLoading,
  } = useTransactionBatchStatus(batchId || null)

  // The delegate goes out as one transaction, so it is retried only when every
  // transaction the batch reports failed.
  const batchFailed = batchFailure(status, transactions, [
    {
      item: 'delegate',
      signatures: transactions.map((tx) => tx.signature),
    },
  ])

  // Only show loading after we have a batchId (transaction submitted)
  const isSubmitting = batchId ? batchLoading || status === 'pending' : false

  const addressBookRef = useRef<AddressBookRef>(null)
  const { networkTokensToDc } = useBalance()
  const wallet = useCurrentWallet()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const dcBalance = useBN(useOwnedAmount(wallet, DC_MINT).amount)
  const { showOKAlert } = useAlert()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const [submitError, setSubmitError] = useState<string | undefined>(undefined)
  const [dcAmount, setDcAmount] = useState(new BN(route.params.amount || 0))
  const [delegateAddress, setDelegateAddress] = useState(route.params.address)
  const [mint, setMint] = useState<PublicKey>(
    (route.params.mint && new PublicKey(route.params.mint)) || IOT_MINT,
  )
  const [memo, setMemo] = useState(route.params.memo)
  const [hasError, setHasError] = useState(false)
  const { symbol } = useMetaplexMetadata(mint)
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)

  const { isDelegate } = route.params

  const containerStyle = {
    marginTop: Platform.OS === 'android' ? top : undefined,
  }

  const networkType = accountNetType(route.params.address)

  const handleShowAccounts = () => {
    if (!accountSelectorRef?.current) return
    accountSelectorRef.current.showAccountTypes(networkType)()
  }

  const amountBalance = dcAmount || new BN(route.params.amount || 0)

  const amountInDc = amountBalance
    ? networkTokensToDc(amountBalance)
    : undefined

  const onTokenItemPressed = () => {
    hntKeyboardRef.current?.show({
      payer: currentAccount,
      balance: amountBalance,
    })
  }

  useEffect(() => {
    if (currentAccount?.netType === networkType || isDelegate) return

    const accts = sortedAccountsForNetType(networkType)

    if (!accts.length) {
      // Show error, they don't have any accounts for this net type
      void showOKAlert({
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

  const handleSubmit = async () => {
    // Reset mutation state on retry
    delegateDataCreditsMutation.reset()
    if (!isDelegate || !amountBalance) return
    try {
      await submitDelegateDataCredits(
        delegateAddress,
        amountBalance.toNumber(),
        mint,
        memo,
      )
    } catch (e) {
      setSubmitError(errorMessage(e))
    }
  }

  const handleQrScan = () => {
    navigation.navigate('PaymentQrScanner')
  }

  const insufficientFunds =
    !!amountBalance &&
    !!dcBalance &&
    !!solBalance &&
    (amountBalance.gt(dcBalance) || FEE.gt(solBalance))

  const errors: string[] = []
  if (insufficientFunds) {
    errors.push(
      t('payment.insufficientFunds', {
        token: dcBalance && amountBalance.gt(dcBalance) ? 'DC' : 'SOL',
      }),
    )
  }

  const handleAddressBookSelected = ({
    address,
    index,
  }: {
    address?: string | undefined
    index: number
  }) => {
    addressBookRef?.current?.showAddressBook({ address, index })
  }

  const handleContactSelected = ({
    contact,
    index,
  }: {
    contact: CSAccount
    prevAddress?: string
    index?: number
  }) => {
    if (index === undefined) return

    const payee = contact.solanaAddress

    if (!payee) return

    setDelegateAddress(payee)
  }

  const handleAddressError = ({ address }: { address: string }) => {
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
  }

  const onMintSelected = (tick: PublicKey) => {
    setMint(tick)
  }

  const handleTokenTypeSelected = () => {
    tokenSelectorRef?.current?.showTokens()
  }

  const data: TokenListItem[] = [
    {
      mint: MOBILE_MINT,
      selected: mint.equals(MOBILE_MINT),
    },
    {
      mint: IOT_MINT,
      selected: mint.equals(IOT_MINT),
    },
  ]

  if (!amountBalance) return null

  return (
    <HNTKeyboard
      ref={hntKeyboardRef}
      onConfirmBalance={(opts) => setDcAmount(new BN(opts.balance))}
      mint={DC_MINT}
      networkFee={FEE}
      usePortal
    >
      <TokenSelector
        ref={tokenSelectorRef}
        onTokenSelected={onMintSelected}
        tokenData={data}
      >
        <AccountSelector ref={accountSelectorRef}>
          <AddressBookSelector
            ref={addressBookRef}
            onContactSelected={handleContactSelected}
            hideCurrentAccount
          >
            <SafeArea
              className="flex-1 bg-secondary"
              style={containerStyle}
              edges={['top'] as Edge[]}
            >
              <View className="flex-row items-center justify-between">
                <View hitSlop={hitSlop} className="p-2">
                  <PressableScale
                    onPress={handleQrScan}
                    accessibilityLabel={t('generic.scanQrCode')}
                    feedback="opacity"
                    className="size-11 items-center justify-center"
                  >
                    <QrIcon size={16} colorClassName="accent-foreground" />
                  </PressableScale>
                </View>
                <Text
                  size="lg"
                  className="flex-1 text-center font-medium"
                  maxFontSizeMultiplier={1}
                >
                  {t(isDelegate ? 'delegate.title' : 'burn.title')}
                </Text>
                <PressableScale
                  onPress={navigation.goBack}
                  accessibilityLabel={t('generic.close')}
                  feedback="opacity"
                  className="w-16 p-6"
                  hitSlop={hitSlop}
                >
                  <CloseIcon size={16} colorClassName="accent-foreground" />
                </PressableScale>
              </View>

              <KeyboardAwareScrollView
                contentInsetAdjustmentBehavior="automatic"
                bottomOffset={75}
                keyboardShouldPersistTaps="always"
              >
                <AccountButton
                  backgroundClassName="bg-secondary"
                  accountIconSize={41}
                  title={formatAccountAlias(currentAccount)}
                  subtitle={t('payment.senderAccount')}
                  showChevron={sortedAccountsForNetType(networkType).length > 1}
                  address={currentAccount?.address}
                  onPress={handleShowAccounts}
                  showBubbleArrow
                  className="pt-6 mx-6 mb-1"
                />

                <TokenButton
                  backgroundClassName="bg-secondary"
                  title={t('burn.subdao', { subdao: symbol })}
                  subtitle={t('burn.choooseSubDAO')}
                  address={currentAccount?.address}
                  onPress={handleTokenTypeSelected}
                  showBubbleArrow
                  mint={mint}
                  className="mx-6"
                />

                {isDelegate ? (
                  <View>
                    <PaymentItem
                      index={0}
                      onAddressBookSelected={handleAddressBookSelected}
                      onEditAmount={onTokenItemPressed}
                      onEditMemo={({ memo: m }) => {
                        setMemo(m)
                      }}
                      onEditAddress={({ address }) => {
                        setDelegateAddress(address)
                        handleAddressError({
                          address,
                        })
                      }}
                      handleAddressError={handleAddressError}
                      mint={DC_MINT}
                      address={delegateAddress}
                      amount={amountBalance}
                      memo={memo}
                      hasError={hasError}
                    />
                  </View>
                ) : (
                  <>
                    <AccountButton
                      backgroundClassName="bg-secondary"
                      accountIconSize={41}
                      subtitle={t('burn.recipient')}
                      title={ellipsizeAddress(
                        route.params.address || delegateAddress,
                      )}
                      showBubbleArrow
                      showChevron={false}
                      address={route.params.address}
                      className="mx-6"
                    />
                    <View className="mx-6 mt-1 overflow-hidden rounded-[20px] bg-secondary px-4">
                      <Text size="xs" className="mt-4 text-muted-foreground">
                        {t('burn.amount')}
                      </Text>
                      <Text size="lg" className="font-medium">
                        {amountBalance.toString()}
                      </Text>
                      <Text size="xs" className="mb-4 text-muted-foreground">
                        {t('payment.fee', {
                          value: humanReadable(FEE, 9),
                        })}
                      </Text>

                      <View className="-mx-4 h-px bg-background" />

                      <Text size="xs" className="mt-4 text-muted-foreground">
                        {t('burn.equivalent')}
                      </Text>
                      <Text size="lg" className="mb-4 font-medium">
                        {amountInDc?.toString()}
                      </Text>

                      <View className="-mx-4 h-px bg-background" />
                    </View>
                  </>
                )}
              </KeyboardAwareScrollView>
              {submitError && (
                <View className="mb-2">
                  <Text
                    size="xs"
                    className="mx-4 mt-2 text-center font-medium text-destructive"
                  >
                    {submitError}
                  </Text>
                </View>
              )}
              <View className="min-h-[220px] overflow-hidden rounded-t-[20px] bg-secondary p-6">
                <PaymentSummary
                  mint={DC_MINT}
                  totalBalance={amountBalance}
                  feeTokenBalance={FEE}
                  errors={errors}
                />
                <View className="flex-1 justify-end">
                  <SubmitButton
                    disabled={
                      amountBalance.isZero() ||
                      hasError ||
                      (!delegateAddress && isDelegate)
                    }
                    className="mt-6"
                    title={t(
                      isDelegate ? 'delegate.swipe' : 'burn.swipeToBurn',
                    )}
                    onSubmit={() => void handleSubmit().catch(console.error)}
                  />
                </View>
              </View>
            </SafeArea>
            <PaymentSubmit
              mint={DC_MINT}
              submitLoading={isSubmitting}
              submitSucceeded={status === 'confirmed'}
              submitError={
                delegateDataCreditsMutation.error || batchFailed?.error
              }
              totalBalance={amountBalance}
              feeTokenBalance={FEE}
              onRetry={
                retrySet(batchFailed, undefined, ['delegate'])
                  ? () => void handleSubmit().catch(console.error)
                  : undefined
              }
              onSuccess={navigation.popToTop}
              actionTitle={t('generic.ok')}
            />
          </AddressBookSelector>
        </AccountSelector>
      </TokenSelector>
    </HNTKeyboard>
  )
}

export default BurnScreen
