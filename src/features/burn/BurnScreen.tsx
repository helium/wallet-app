import Close from '@assets/svgs/close.svg'
import QR from '@assets/svgs/qr.svg'
import Box from '@components/Box'
import SubmitButton from '@components/SubmitButton'
import Text from '@components/Text'
import TokenButton from '@components/TokenButton'
import TokenSelector, {
  TokenListItem,
  TokenSelectorRef,
} from '@components/TokenSelector'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
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
import { useColors, useHitSlop, useSpacing } from '@config/theme/themeHooks'
import { BN } from 'bn.js'
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
import { useSelector } from 'react-redux'
import {
  WalletNavigationProp,
  WalletStackParamList,
} from '@services/WalletService/pages/WalletPage'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { CSAccount } from '@config/storage/cloudStorage'
import { NavBarHeight } from '@components/ServiceNavBar'
import ScrollBox from '@components/ScrollBox'
import AddressBookSelector, {
  AddressBookRef,
} from '../../components/AddressBookSelector'
import HNTKeyboard, { HNTKeyboardRef } from '../../components/HNTKeyboard'
import IconPressedContainer from '../../components/IconPressedContainer'
import useSubmitTxn from '../../hooks/useSubmitTxn'
import { RootState } from '../../store/rootReducer'
import { useBalance } from '../../utils/Balance'
import { accountNetType, solAddressIsValid } from '../../utils/accountUtils'
import { TXN_FEE_IN_SOL } from '../../utils/solanaUtils'
import PaymentItem from '../payment/PaymentItem'
import PaymentSubmit from '../payment/PaymentSubmit'
import PaymentSummary from '../payment/PaymentSummary'

const FEE = new BN(TXN_FEE_IN_SOL)

type Route = RouteProp<WalletStackParamList, 'BurnScreen'>
const BurnScreen = () => {
  const route = useRoute<Route>()
  const {
    accounts,
    currentAccount,
    sortedAccountsForNetType,
    setCurrentAccount,
    defaultAccountAddress,
  } = useAccountStorage()
  const spacing = useSpacing()
  const { top, bottom } = useSafeAreaInsets()
  const navigation = useNavigation<WalletNavigationProp>()
  const { t } = useTranslation()
  const { primaryText } = useColors()
  const hitSlop = useHitSlop('6')
  const { submitDelegateDataCredits } = useSubmitTxn()
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
  const delegatePayment = useSelector(
    (reduxState: RootState) => reduxState.solana.delegate,
  )
  const { symbol } = useMetaplexMetadata(mint)
  const tokenSelectorRef = useRef<TokenSelectorRef>(null)

  const { isDelegate } = useMemo(() => route.params, [route.params])

  const containerStyle = useMemo(
    () => ({
      marginTop: Platform.OS === 'android' ? top : undefined,
      paddingBottom: NavBarHeight + spacing['2xl'] + bottom,
      flex: 1,
    }),
    [top, spacing, bottom],
  )

  const networkType = useMemo(
    () => accountNetType(route.params.address),
    [route.params.address],
  )

  const amountBalance = useMemo(() => {
    const amount = new BN(route.params.amount || 0)

    if (dcAmount) return dcAmount

    return amount
  }, [dcAmount, route.params.amount])

  const amountInDc = useMemo(() => {
    if (!amountBalance) return
    return networkTokensToDc(amountBalance)
  }, [amountBalance, networkTokensToDc])

  const onTokenItemPressed = useCallback(() => {
    Keyboard.dismiss()
    hntKeyboardRef.current?.show({
      payer: currentAccount,
      payee: delegateAddress,
      index: 0,
      balance: amountBalance,
      payments: [],
    })
  }, [amountBalance, currentAccount, delegateAddress])

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
    try {
      if (isDelegate && amountBalance) {
        await submitDelegateDataCredits(
          delegateAddress,
          amountBalance.toNumber(),
          mint,
          memo,
        )
      }
    } catch (e) {
      setSubmitError((e as Error)?.message)
    }
  }, [
    amountBalance,
    delegateAddress,
    isDelegate,
    mint,
    memo,
    submitDelegateDataCredits,
    setSubmitError,
  ])

  const handleQrScan = useCallback(() => {
    navigation.navigate('PaymentQrScanner')
  }, [navigation])

  const insufficientFunds = useMemo(() => {
    if (!amountBalance || !dcBalance || !solBalance) return false

    return amountBalance.gt(dcBalance) || FEE.gt(solBalance)
  }, [amountBalance, dcBalance, solBalance])

  const errors = useMemo(() => {
    const errStrings: string[] = []
    if (insufficientFunds) {
      errStrings.push(
        t('payment.insufficientFunds', {
          token: dcBalance && amountBalance.gt(dcBalance) ? 'DC' : 'SOL',
        }),
      )
    }

    return errStrings
  }, [amountBalance, dcBalance, insufficientFunds, t])

  const onConfirmBalance = useCallback((opts) => {
    setDcAmount(new BN(opts.balance))
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

      const payee = contact.solanaAddress

      if (!payee) return

      setDelegateAddress(payee)
    },
    [],
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

  const onMintSelected = useCallback((tick: PublicKey) => {
    setMint(tick)
  }, [])

  const handleTokenTypeSelected = useCallback(() => {
    tokenSelectorRef?.current?.showTokens()
  }, [])

  const data = useMemo(
    (): TokenListItem[] => [
      {
        mint: MOBILE_MINT,
        selected: mint.equals(MOBILE_MINT),
      },
      {
        mint: IOT_MINT,
        selected: mint.equals(IOT_MINT),
      },
    ],
    [mint],
  )

  if (!amountBalance) return null

  return (
    <>
      <ScrollBox
        backgroundColor="secondaryBackground"
        flex={1}
        contentContainerStyle={containerStyle}
        paddingTop="6xl"
      >
        <Box
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box hitSlop={hitSlop} padding="2">
            <IconPressedContainer
              onPress={handleQrScan}
              activeOpacity={0.75}
              idleOpacity={1.0}
            >
              <QR color={primaryText} height={16} width={16} />
            </IconPressedContainer>
          </Box>
          <Text
            variant="textLgMedium"
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
            padding="6"
            hitSlop={hitSlop}
          >
            <Close color={primaryText} height={16} width={16} />
          </TouchableOpacityBox>
        </Box>

        <KeyboardAwareScrollView
          enableOnAndroid
          keyboardShouldPersistTaps="always"
        >
          <TokenButton
            backgroundColor="cardBackground"
            title={t('burn.subdao', { subdao: symbol })}
            subtitle={t('burn.choooseSubDAO')}
            address={currentAccount?.address}
            onPress={handleTokenTypeSelected}
            marginHorizontal="6"
            mint={mint}
          />

          {isDelegate ? (
            <Box>
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
                account={currentAccount || undefined}
                amount={amountBalance}
                memo={memo}
                hasError={hasError}
              />
            </Box>
          ) : (
            <>
              <Box
                marginTop="xs"
                marginHorizontal="6"
                backgroundColor="secondaryBackground"
                borderRadius="4xl"
                paddingHorizontal="4"
                overflow="hidden"
              >
                <Text
                  variant="textXsRegular"
                  color="secondaryText"
                  marginTop="4"
                >
                  {t('burn.amount')}
                </Text>
                <Text variant="textLgMedium" color="primaryText">
                  {amountBalance.toString()}
                </Text>
                <Text
                  variant="textXsRegular"
                  marginBottom="4"
                  color="secondaryText"
                >
                  {t('payment.fee', {
                    value: humanReadable(FEE, 9),
                  })}
                </Text>

                <Box
                  height={1}
                  backgroundColor="primaryBackground"
                  marginHorizontal="-4"
                />

                <Text
                  variant="textXsRegular"
                  color="secondaryText"
                  marginTop="4"
                >
                  {t('burn.equivalent')}
                </Text>
                <Text
                  variant="textLgMedium"
                  color="primaryText"
                  marginBottom="4"
                >
                  {amountInDc?.toString()}
                </Text>

                <Box
                  height={1}
                  backgroundColor="primaryBackground"
                  marginHorizontal="-4"
                />
              </Box>
            </>
          )}
        </KeyboardAwareScrollView>
        {submitError && (
          <Box marginBottom="2">
            <Text
              marginTop="2"
              marginHorizontal="4"
              variant="textXsMedium"
              color="error.500"
              textAlign="center"
            >
              {submitError}
            </Text>
          </Box>
        )}
        <Box flex={1} />

        <Box paddingHorizontal="4xl">
          <PaymentSummary
            mint={DC_MINT}
            totalBalance={amountBalance}
            feeTokenBalance={FEE}
            errors={errors}
          />
          <SubmitButton
            color="primaryText"
            backgroundColor="cardBackground"
            disabled={
              amountBalance.isZero() ||
              hasError ||
              (!delegateAddress && isDelegate)
            }
            marginTop="6"
            title={t(isDelegate ? 'delegate.swipe' : 'burn.swipeToBurn')}
            onSubmit={handleSubmit}
          />
        </Box>
        <PaymentSubmit
          mint={DC_MINT}
          submitLoading={!!delegatePayment?.loading}
          submitSucceeded={delegatePayment?.success}
          submitError={delegatePayment?.error}
          totalBalance={amountBalance}
          feeTokenBalance={FEE}
          onRetry={handleSubmit}
          onSuccess={navigation.popToTop}
          actionTitle={t('generic.ok')}
        />
      </ScrollBox>
      <HNTKeyboard
        ref={hntKeyboardRef}
        onConfirmBalance={onConfirmBalance}
        mint={DC_MINT}
        networkFee={FEE}
      />
      <TokenSelector
        ref={tokenSelectorRef}
        onTokenSelected={onMintSelected}
        tokenData={data}
      />
      <AddressBookSelector
        ref={addressBookRef}
        onContactSelected={handleContactSelected}
        hideCurrentAccount
      />
    </>
  )
}

export default reactMemo(BurnScreen)
