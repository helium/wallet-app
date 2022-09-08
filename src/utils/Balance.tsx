import { NetTypes } from '@helium/address'
import Balance, {
  CurrencyType,
  DataCredits,
  IotTokens,
  MobileTokens,
  NetworkTokens,
  TestNetworkTokens,
} from '@helium/currency'
import { round } from 'lodash'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import useAppState from 'react-native-appstate-hook'
import CurrencyFormatter from 'react-native-currency-format'
import {
  AccountData,
  TokenType,
  useAccountLazyQuery,
  useAccountQuery,
  useOracleDataLazyQuery,
  useOracleDataQuery,
} from '../generated/graphql'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { accountCurrencyType } from './accountUtils'
import { CoinGeckoPrices, getCurrentPrices } from './coinGeckoClient'
import { decimalSeparator, groupSeparator } from './i18n'
import useMount from './useMount'
import usePrevious from './usePrevious'

export const ORACLE_POLL_INTERVAL = 1000 * 15 * 60 // 15 minutes
const useBalanceHook = () => {
  const { currentAccount } = useAccountStorage()
  const { convertToCurrency, currency } = useAppStorage()

  const {
    data: oracleData,
    loading: loadingOracle,
    error,
  } = useOracleDataQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: ORACLE_POLL_INTERVAL,
    notifyOnNetworkStatusChange: true,
    skip: !currentAccount?.address,
  })
  const [fetchOracle] = useOracleDataLazyQuery()
  const { data: accountData } = useAccountQuery({
    variables: {
      address: currentAccount?.address || '',
    },
    fetchPolicy: 'cache-and-network',
    skip: !currentAccount?.address,
  })
  const [fetchAccountData] = useAccountLazyQuery()

  const prevLoadingOracle = usePrevious(loadingOracle)
  const [oracleDateTime, setOracleDateTime] = useState<Date>()
  const [coinGeckoPrices, setCoinGeckoPrices] = useState<CoinGeckoPrices>()

  const updateCoinGeckoPrices = useCallback(
    () => getCurrentPrices().then(setCoinGeckoPrices),
    [],
  )

  useMount(() => {
    updateCoinGeckoPrices()
  })

  useAppState({ onForeground: updateCoinGeckoPrices })

  const updateVars = useCallback(() => {
    updateCoinGeckoPrices()

    if (!currentAccount?.address) return

    fetchOracle({
      variables: {
        address: currentAccount.address,
      },
    })

    fetchAccountData({
      variables: {
        address: currentAccount.address,
      },
    })
  }, [currentAccount, fetchAccountData, fetchOracle, updateCoinGeckoPrices])

  const oraclePrice = useMemo(() => {
    if (!oracleData?.currentOraclePrice) return

    const {
      currentOraclePrice: { price },
    } = oracleData
    return new Balance(price, CurrencyType.usd)
  }, [oracleData])

  useEffect(() => {
    if (prevLoadingOracle && !loadingOracle && oracleData && !error) {
      setOracleDateTime(new Date())
    }
  }, [oracleData, error, loadingOracle, prevLoadingOracle])

  const dcToNetworkTokens = useCallback(
    (
      dcBalance: Balance<DataCredits>,
    ): Balance<TestNetworkTokens | NetworkTokens> | undefined => {
      if (!oraclePrice) return

      if (currentAccount?.netType === NetTypes.TESTNET) {
        return dcBalance.toTestNetworkTokens(oraclePrice)
      }
      return dcBalance.toNetworkTokens(oraclePrice)
    },
    [currentAccount, oraclePrice],
  )

  const currencyTypeFromTokenType = useCallback(
    (type: TokenType | null | undefined) => {
      switch (type) {
        case TokenType.Hst:
          return CurrencyType.security
        case TokenType.Iot:
          return CurrencyType.iot
        case TokenType.Mobile:
          return CurrencyType.mobile
        case TokenType.Hnt:
        default:
          if (currentAccount?.netType === NetTypes.TESTNET)
            return CurrencyType.testNetworkToken
          return CurrencyType.networkToken
      }
    },
    [currentAccount],
  )

  const floatToBalance = useCallback(
    (value: number, tokenType: TokenType) => {
      if (!currentAccount) {
        console.warn('Cannot convert float to balance for nil account')
        return
      }
      return Balance.fromFloat(value, currencyTypeFromTokenType(tokenType))
    },
    [currencyTypeFromTokenType, currentAccount],
  )

  const bonesToBalance = useCallback(
    (v: number | undefined | null, tokenType: TokenType | null | undefined) => {
      return new Balance(v || 0, currencyTypeFromTokenType(tokenType))
    },
    [currencyTypeFromTokenType],
  )

  const intToBalance = useCallback(
    (opts: { intValue?: number }) => {
      if (!opts.intValue === undefined || !currentAccount) {
        console.warn('Cannot convert int to balance')
        return
      }
      return new Balance(
        opts.intValue,
        accountCurrencyType(currentAccount.address),
      )
    },
    [currentAccount],
  )

  const accountNetworkBalance = useMemo(() => {
    if (accountData?.account?.balance === undefined || !currentAccount) {
      return
    }
    return new Balance(
      accountData?.account?.balance,
      accountCurrencyType(currentAccount.address),
    )
  }, [accountData, currentAccount])

  const accountMobileBalance = useMemo(() => {
    if (
      accountData?.account?.mobileBalance === undefined ||
      accountData.account.mobileBalance === null ||
      !currentAccount
    ) {
      return
    }
    return new Balance(accountData.account.mobileBalance, CurrencyType.mobile)
  }, [accountData, currentAccount])

  const toPreferredCurrencyString = useCallback(
    (
      balance?: Balance<DataCredits | NetworkTokens | TestNetworkTokens>,
      opts?: { maxDecimalPlaces?: number; showTicker?: boolean },
    ): Promise<string> => {
      if (!balance) {
        return new Promise<string>((resolve) => resolve(''))
      }
      const multiplier = coinGeckoPrices?.[currency.toLowerCase()] || 0

      const showAsHnt =
        !convertToCurrency ||
        !multiplier ||
        balance?.type.ticker === CurrencyType.dataCredit.ticker ||
        balance?.type.ticker === CurrencyType.testNetworkToken.ticker

      if (!showAsHnt) {
        const convertedValue = multiplier * (balance?.floatBalance || 0)
        return CurrencyFormatter.format(convertedValue, currency)
      }
      return new Promise<string>((resolve) =>
        resolve(balanceToString(balance, opts)),
      )
    },
    [coinGeckoPrices, convertToCurrency, currency],
  )

  const toCurrencyString = useCallback(
    (balance?: Balance<NetworkTokens | TestNetworkTokens>): Promise<string> => {
      const defaultResponse = new Promise<string>((resolve) => resolve(''))
      if (!balance || balance?.floatBalance === undefined) {
        return defaultResponse
      }

      const multiplier = coinGeckoPrices?.[currency.toLowerCase()] || 0
      if (!multiplier) return defaultResponse

      const convertedValue = multiplier * balance.floatBalance
      return CurrencyFormatter.format(convertedValue, currency)
    },
    [coinGeckoPrices, currency],
  )

  const toUsd = useCallback(
    (balance?: Balance<NetworkTokens | TestNetworkTokens>): number => {
      if (!balance) {
        return 0
      }
      const multiplier = coinGeckoPrices?.usd || 0

      return round(multiplier * (balance?.floatBalance || 0), 2)
    },
    [coinGeckoPrices],
  )

  return {
    accountNetworkBalance,
    accountMobileBalance,
    bonesToBalance,
    currencyTypeFromTokenType,
    dcToNetworkTokens,
    floatToBalance,
    intToBalance,
    oracleDateTime,
    oraclePrice,
    toCurrencyString,
    toPreferredCurrencyString,
    toUsd,
    updateVars,
  }
}

const initialState = {
  accountNetworkBalance: undefined,
  accountMobileBalance: undefined,
  bonesToBalance: () => new Balance(0, CurrencyType.networkToken),
  currencyTypeFromTokenType: () => CurrencyType.networkToken,
  dcToNetworkTokens: () => undefined,
  floatToBalance: () => undefined,
  intToBalance: () => undefined,
  oracleDateTime: undefined,
  oraclePrice: undefined,
  toCurrencyString: () => new Promise<string>((resolve) => resolve('')),
  toPreferredCurrencyString: () =>
    new Promise<string>((resolve) => resolve('')),
  toUsd: () => 0,
  updateVars: () => undefined,
}

const BalanceContext =
  createContext<ReturnType<typeof useBalanceHook>>(initialState)
const { Provider } = BalanceContext

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useBalanceHook()}>{children}</Provider>
}

export const useBalance = () => useContext(BalanceContext)

export const balanceToString = (
  balance?: Balance<
    DataCredits | NetworkTokens | TestNetworkTokens | MobileTokens | IotTokens
  >,
  opts?: { maxDecimalPlaces?: number; showTicker?: boolean },
) => {
  if (!balance) return ''
  return balance.toString(opts?.maxDecimalPlaces, {
    groupSeparator,
    decimalSeparator,
    showTicker: opts?.showTicker,
  })
}

export const useAccountBalances = (
  accountData: AccountData | null | undefined,
) =>
  useMemo(() => {
    if (!accountData) return
    const currencyType = accountCurrencyType(accountData.address)

    return {
      hnt: new Balance(accountData.balance || 0, currencyType),
      mobile: new Balance(accountData.mobileBalance || 0, CurrencyType.mobile),
      dc: new Balance(accountData.dcBalance || 0, CurrencyType.dataCredit),
      stakedHnt: new Balance(accountData.stakedBalance || 0, currencyType),
      hst: new Balance(accountData.secBalance || 0, CurrencyType.security),
      address: accountData?.address,
      hntBal: accountData.balance,
    }
  }, [accountData])
