import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import ChevronDown from '@assets/images/chevronDown.svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Balance, { CurrencyType } from '@helium/currency'
import Lock from '@assets/images/lockClosed.svg'
import { LayoutChangeEvent, Platform } from 'react-native'
import { useAsync } from 'react-async-hook'
import { NetworkInfo } from 'react-native-network-info'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import { NetType } from '@helium/crypto-react-native'
import Box from '../../components/Box'
import Text from '../../components/Text'
import { useColors, useHitSlop } from '../../theme/themeHooks'
import { HomeNavigationProp } from '../home/homeTypes'
import SegmentedControl from '../../components/SegmentedControl'
import ButtonPressable from '../../components/ButtonPressable'
import { useAnimateTransition } from '../../utils/animateTransition'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import AccountIcon from '../../components/AccountIcon'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { useAccountSelector } from '../../components/AccountSelector'
import {
  authorize,
  enableMac,
  getAccount,
  getMacForIp,
  ScAccount,
  SessionType,
  submitBurnTxn,
} from '../../utils/httpClient/scManagerClient'
import { useTransactions } from '../../storage/TransactionProvider'
import useAlert from '../../utils/useAlert'
import SafeAreaBox, {
  useModalSafeAreaEdges,
} from '../../components/SafeAreaBox'
import { AccountNetTypeOpt } from '../../utils/accountUtils'
import { balanceToString } from '../../utils/Balance'
import usePrevious from '../../utils/usePrevious'

const TIMER_SECONDS = 15 * 60 // 15 minutes
const WifiPurchase = () => {
  const { currentAccount } = useAccountStorage()
  const prevAccount = usePrevious(currentAccount)
  const [macEnabled, setMacEnabled] = useState(false)
  const [scAccount, setScAccount] = useState<ScAccount>()
  const { animate, isAnimating } = useAnimateTransition()

  const { makeBurnTxn } = useTransactions()
  const navigation = useNavigation<HomeNavigationProp>()
  const { bottom } = useSafeAreaInsets()
  const { t } = useTranslation()
  const { primaryText, surfaceSecondary } = useColors()
  const hitSlop = useHitSlop('xl')
  const [type, setType] = useState<SessionType>('data')
  const [viewState, setViewState] = useState<'select' | 'confirm' | 'submit'>(
    'select',
  )
  const [accountsType] = useState<AccountNetTypeOpt>(NetType.TESTNET)
  const [dataIndex, setDataIndex] = useState(0)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [iPAddress, setIPAddress] = useState<string | null>(null)
  const [gatewayIPAddress, setGatewayIPAddress] = useState<string | null>(null)
  const [wifiMac, setWifiMac] = useState<string>()
  const [timerWidth, setTimerWidth] = useState(0)
  const timerRef = useRef<NodeJS.Timeout>()
  const { showAccountTypes } = useAccountSelector()
  const { showOKAlert } = useAlert()
  const edges = useModalSafeAreaEdges()

  useEffect(() => {
    changeNavigationBarColor(surfaceSecondary, true, false)
  }, [surfaceSecondary])

  useEffect(() => {
    NetworkInfo.getGatewayIPAddress().then(setGatewayIPAddress)
    NetworkInfo.getIPAddress().then(setIPAddress)
  }, [])

  const timeStr = useMemo(
    () => new Date(timerSeconds * 1000).toISOString().substring(14, 19),
    [timerSeconds],
  )

  useAsync(async () => {
    if (!gatewayIPAddress || !iPAddress) return

    try {
      const mac = await getMacForIp(gatewayIPAddress, iPAddress)
      setWifiMac(mac)
      enableMac(gatewayIPAddress, mac).then(setMacEnabled)
    } catch (e) {
      console.error(e)
      let errStr = ''
      if (typeof e === 'string') {
        errStr = e
      } else if (e instanceof Error) {
        errStr = e.message
      }

      await showOKAlert({
        title: t('wifi.macFailed'),
        message: errStr,
      })
      navigation.goBack()
    }
  }, [gatewayIPAddress, iPAddress])

  useEffect(() => {
    if (
      (timerSeconds !== 0 && prevAccount === currentAccount) ||
      !macEnabled ||
      !currentAccount?.address
    ) {
      return
    }

    getAccount(currentAccount?.address).then(setScAccount)
  }, [currentAccount, macEnabled, prevAccount, timerSeconds])

  useEffect(() => {
    // if (!heliumDataLoading) return
    if (timerRef.current) {
      clearInterval(timerRef.current)
      setTimerSeconds(TIMER_SECONDS)
    }
    timerRef.current = setInterval(() => {
      setTimerSeconds((prevSeconds) => {
        const nextSeconds = prevSeconds - 1
        return nextSeconds > -1 ? nextSeconds : TIMER_SECONDS
      })
    }, 1000)
  }, [])

  useEffect(
    () =>
      navigation.addListener('blur', () => {
        if (!timerRef.current) return
        clearInterval(timerRef.current)
      }),

    [navigation],
  )

  const segmentData = useMemo(
    () => [
      { id: 'data', title: t('wifi.data') },
      { id: 'minutes', title: t('wifi.minutes') },
    ],
    [t],
  )

  const bottomStyle = useMemo(
    () => ({
      paddingBottom: bottom,
    }),
    [bottom],
  )

  const accountBalance = useMemo(() => {
    if (!scAccount?.user.balance) return

    if (accountsType === NetType.TESTNET)
      return new Balance(scAccount?.user.balance, CurrencyType.testNetworkToken)

    return new Balance(scAccount?.user.balance, CurrencyType.networkToken)
  }, [accountsType, scAccount])

  const onSegmentChange = useCallback((id: string) => {
    setType(id as 'data' | 'time')
  }, [])

  const amounts = useMemo(() => {
    // TODO: Prices are just placeholder for now
    const multiplier = (scAccount?.price || 0) / 10000
    if (type === 'data') {
      return [
        { val: 1, price: multiplier },
        { val: 5, price: 5 * multiplier },
        { val: 20, price: 20 * multiplier },
      ]
    }
    return [
      { val: 300, price: multiplier },
      { val: 600, price: 2 * multiplier },
      { val: 1000, price: 3 * multiplier },
    ]
  }, [scAccount, type])

  const priceBalance = useMemo(() => {
    return new Balance(amounts[dataIndex].price, CurrencyType.dataCredit)
  }, [amounts, dataIndex])

  const handleAmountChange = useCallback(
    (index: number) => () => {
      setDataIndex(index)
    },
    [],
  )

  const handleBurn = useCallback(async () => {
    if (!currentAccount?.address || !scAccount?.user) return
    try {
      const txn = await makeBurnTxn({
        payeeB58: scAccount.payee,
        amount: priceBalance.integerBalance,
        memo: scAccount?.user.memo,
        nonce: scAccount.user.nonce + 1,
        dcPayloadSize: scAccount.dcPayloadSize,
        txnFeeMultiplier: scAccount.txnFeeMultiplier,
      })

      if (!txn.signedTxn) {
        // TODO: Eventually will need to handle ledger devices
        return
      }

      await submitBurnTxn(currentAccount.address, txn.signedTxn.toString())
    } catch (e) {
      console.error(e)
      let errStr = ''
      if (typeof e === 'string') {
        errStr = e
      } else if (e instanceof Error) {
        errStr = e.message
      }
      await showOKAlert({
        title: t('wifi.burnFailed'),
        message: errStr,
      })
    }
  }, [
    currentAccount,
    makeBurnTxn,
    priceBalance.integerBalance,
    scAccount,
    showOKAlert,
    t,
  ])

  const handleAuth = useCallback(async () => {
    if (!currentAccount || !wifiMac) return
    try {
      await authorize(currentAccount.address, {
        macAddr: wifiMac,
        // TODO: This will come from the deep link from the FAS
        accessPoint: '1YmdZQxX7zfA7g3dbx3rgTK46fjSNV3zDDUCMPBPXpwmxEWym8X',
        type,
        amount: amounts[dataIndex].val,
      })
    } catch (e) {
      console.error(e)
      let errStr = ''
      if (typeof e === 'string') {
        errStr = e
      } else if (e instanceof Error) {
        errStr = e.message
      }
      await showOKAlert({
        title: t('wifi.burnFailed'),
        message: errStr,
      })
    }
  }, [amounts, currentAccount, dataIndex, showOKAlert, t, type, wifiMac])

  const handleSubmit = useCallback(async () => {
    if (!currentAccount?.address || !scAccount?.user || !wifiMac) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    await Promise.all([handleBurn(), handleAuth()])

    navigation.goBack()
  }, [currentAccount, scAccount, wifiMac, handleBurn, handleAuth, navigation])

  const handleViewStateChange = useCallback(
    (val: 'select' | 'confirm' | 'submit') => () => {
      animate('WifiPurchase.handleNext')
      setViewState(val)

      if (val === 'submit') {
        handleSubmit()
      }
    },
    [animate, handleSubmit],
  )

  const oraclePrice = useMemo(() => {
    if (!scAccount?.price) return

    return new Balance(scAccount.price, CurrencyType.usd)
  }, [scAccount])

  const remainingBalance = useMemo(() => {
    if (!accountBalance || !priceBalance || !oraclePrice) return
    if (accountsType === NetType.TESTNET) {
      return accountBalance.minus(priceBalance.toTestNetworkTokens(oraclePrice))
    }
    return accountBalance.minus(priceBalance.toTestNetworkTokens(oraclePrice))
  }, [accountBalance, accountsType, oraclePrice, priceBalance])

  const hasSufficientAccountBalance = useMemo(() => {
    if (!remainingBalance) return false
    return remainingBalance.integerBalance >= 0
  }, [remainingBalance])

  const handleTimerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (timerWidth) return
      setTimerWidth(event.nativeEvent.layout.width)
    },
    [timerWidth],
  )

  const submitDisabled = useMemo(() => {
    const balanceRequired = viewState !== 'select'

    return (
      (balanceRequired ? !hasSufficientAccountBalance : false) || !scAccount
    )
  }, [hasSufficientAccountBalance, scAccount, viewState])

  const tokenPrice = useMemo(() => {
    if (!oraclePrice) return ''
    if (accountsType === NetType.TESTNET) {
      return balanceToString(priceBalance.toTestNetworkTokens(oraclePrice), {
        maxDecimalPlaces: 4,
      })
    }
    return balanceToString(priceBalance.toNetworkTokens(oraclePrice), {
      maxDecimalPlaces: 4,
    })
  }, [accountsType, oraclePrice, priceBalance])

  const positiveButtonText = useMemo(() => {
    if (viewState === 'select' || (isAnimating && Platform.OS === 'android')) {
      // On android updating text while animating leads to layout bugs
      return t('generic.next')
    }
    return t('wifi.confirmPayment')
  }, [isAnimating, t, viewState])

  return (
    <SafeAreaBox flex={1} alignItems="center" paddingTop="l" edges={edges}>
      {viewState === 'select' && (
        <Box
          justifyContent="center"
          flex={1}
          width="100%"
          alignItems="center"
          paddingHorizontal="xl"
        >
          {/* TODO: Make segmented control style more configurable */}
          <SegmentedControl
            width={260}
            onChange={onSegmentChange}
            padding="ms"
            selectedId={type}
            values={segmentData}
          />

          <Text
            marginTop="l"
            variant="h3"
            textAlign="center"
            color="primaryText"
            maxFontSizeMultiplier={1}
          >
            {t('wifi.howMuch')}
          </Text>
          <Box flexDirection="row" marginTop="l">
            {amounts.map((a, index) => {
              const title = `${a.val}${type === 'data' ? 'GB' : ''}`

              return (
                <ButtonPressable
                  title={title}
                  key={a.val}
                  height={58}
                  flex={1}
                  backgroundColor="primaryBackground"
                  backgroundColorPressed="surfaceSecondary"
                  borderRadius="l"
                  selected={index === dataIndex}
                  marginRight={index !== amounts.length - 1 ? 's' : 'none'}
                  onPress={handleAmountChange(index)}
                />
              )
            })}
          </Box>
        </Box>
      )}
      {viewState !== 'select' && (
        <Box
          justifyContent="center"
          flex={1}
          width="100%"
          alignItems="center"
          paddingHorizontal="xl"
        >
          <Text
            marginTop="l"
            variant="subtitle2"
            textAlign="center"
            color="primaryText"
            maxFontSizeMultiplier={1}
          >
            {t('wifi.youArePurchasing')}
          </Text>
          <Box
            backgroundColor="surfaceSecondary"
            borderRadius="l"
            padding="m"
            marginVertical="m"
          >
            <Text variant="h1" color="primaryText" maxFontSizeMultiplier={1}>
              {`${amounts[dataIndex].val}${type === 'data' ? 'GB' : ''}`}
            </Text>
          </Box>
          <TouchableOpacityBox
            onPress={handleViewStateChange('select')}
            hitSlop={hitSlop}
            disabled={viewState === 'submit'}
          >
            <Text variant="body1" color="secondaryText">
              {t('wifi.change')}
            </Text>
          </TouchableOpacityBox>
        </Box>
      )}
      {viewState !== 'select' && (
        <Box
          paddingLeft="ms"
          paddingVertical="xxs"
          alignSelf="flex-end"
          margin="m"
          backgroundColor="surfaceSecondary"
          borderRadius="round"
          width={timerWidth || undefined}
          flexDirection="row"
          alignItems="center"
          onLayout={handleTimerLayout}
        >
          <Lock color={primaryText} />
          <Text
            paddingRight="ms"
            variant="body2"
            color="primaryText"
            marginLeft="xs"
            textAlign="right"
            numberOfLines={1}
          >
            {timeStr}
          </Text>
        </Box>
      )}
      <Box
        style={bottomStyle}
        width="100%"
        backgroundColor="surfaceSecondary"
        borderTopLeftRadius="xl"
        borderTopRightRadius="xl"
      >
        {viewState !== 'select' && (
          <TouchableOpacityBox
            paddingHorizontal="xl"
            paddingVertical="l"
            borderBottomColor="primaryBackground"
            borderBottomWidth={1}
            flexDirection="row"
            alignItems="center"
            onPress={showAccountTypes(accountsType)}
          >
            <AccountIcon size={26} address={currentAccount?.address} />
            <Text marginLeft="ms" variant="subtitle2" flex={1}>
              {currentAccount?.alias}
            </Text>
            <ChevronDown />
          </TouchableOpacityBox>
        )}
        <Box paddingVertical="l" paddingHorizontal="xl">
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Text variant="body1" color="primaryText">
              {t('generic.total')}
            </Text>
            {accountsType === NetType.MAINNET && (
              <Text variant="body1" color="primaryText" fontSize={25}>
                {/* TODO: Convert to locale currency */}
                {balanceToString(priceBalance.toUsd(oraclePrice), {
                  maxDecimalPlaces: 2,
                })}
              </Text>
            )}
            {accountsType === NetType.TESTNET && (
              <Text variant="body1" color="primaryText" fontSize={25}>
                {/* TODO: Convert to locale currency */}
                $xx.00 USD
              </Text>
            )}
          </Box>
          <Text variant="body1" color="secondaryText" alignSelf="flex-end">
            {tokenPrice}
          </Text>
        </Box>
        {viewState !== 'select' && (
          <Box
            paddingHorizontal="xl"
            paddingVertical="l"
            borderTopColor="primaryBackground"
            borderTopWidth={1}
          >
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text variant="body1" color="primaryText">
                {t('wifi.remainingBalance')}
              </Text>
              <Text variant="body1" color="primaryText" fontSize={25}>
                {balanceToString(remainingBalance, {
                  maxDecimalPlaces: 3,
                })}
              </Text>
            </Box>
            {hasSufficientAccountBalance && accountsType === NetType.TESTNET && (
              <Text variant="body1" color="secondaryText" alignSelf="flex-end">
                {/* TODO: Convert to locale currency */}
                {'(TNT) => Dollars'}
              </Text>
            )}
            {hasSufficientAccountBalance && accountsType === NetType.MAINNET && (
              <Text variant="body1" color="secondaryText" alignSelf="flex-end">
                {/* TODO: Convert to locale currency */}
                {balanceToString(remainingBalance?.toUsd(oraclePrice), {
                  maxDecimalPlaces: 2,
                })}
              </Text>
            )}

            {!hasSufficientAccountBalance && (
              <Text variant="body1" color="error" alignSelf="flex-end">
                {t('wifi.insufficientFunds')}
              </Text>
            )}
          </Box>
        )}
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
            onPress={handleViewStateChange(
              viewState !== 'select' ? 'submit' : 'confirm',
            )}
            disabled={submitDisabled}
          />
        </Box>
      </Box>
    </SafeAreaBox>
  )
}

export default WifiPurchase
