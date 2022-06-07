import { NetTypes as NetType } from '@helium/address'
import Balance, {
  CurrencyType,
  DataCredits,
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
    fetchPolicy: 'cache-only',
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

  const dcToTokens = useCallback(
    (
      dcBalance: Balance<DataCredits>,
    ): Balance<TestNetworkTokens | NetworkTokens> | undefined => {
      if (!oraclePrice) return

      if (currentAccount?.netType === NetType.TESTNET) {
        return dcBalance.toTestNetworkTokens(oraclePrice)
      }
      return dcBalance.toNetworkTokens(oraclePrice)
    },
    [currentAccount, oraclePrice],
  )

  const floatToBalance = useCallback(
    (value: number) => {
      if (!currentAccount) {
        console.warn('Cannot convert float to balance for nil account')
        return
      }
      return Balance.fromFloat(
        value,
        accountCurrencyType(currentAccount.address),
      )
    },
    [currentAccount],
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

  const zeroBalanceNetworkToken = useMemo(
    () => new Balance(0, accountCurrencyType(currentAccount?.address)),
    [currentAccount],
  )

  const accountBalance = useMemo(() => {
    if (accountData?.account?.balance === undefined || !currentAccount) {
      console.warn('Cannot convert int to balance')
      return
    }
    return new Balance(
      accountData?.account?.balance,
      accountCurrencyType(currentAccount.address),
    )
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
      if (!balance) {
        return new Promise<string>((resolve) => resolve(''))
      }
      const multiplier = coinGeckoPrices?.[currency.toLowerCase()] || 0

      const convertedValue = multiplier * (balance?.floatBalance || 0)
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
    accountBalance,
    dcToTokens,
    floatToBalance,
    intToBalance,
    oracleDateTime,
    oraclePrice,
    toCurrencyString,
    toPreferredCurrencyString,
    toUsd,
    updateVars,
    zeroBalanceNetworkToken,
  }
}

const initialState = {
  accountBalance: undefined,
  dcToTokens: () => undefined,
  floatToBalance: () => undefined,
  intToBalance: () => undefined,
  oracleDateTime: undefined,
  oraclePrice: undefined,
  toCurrencyString: () => new Promise<string>((resolve) => resolve('')),
  toPreferredCurrencyString: () =>
    new Promise<string>((resolve) => resolve('')),
  toUsd: () => 0,
  updateVars: () => undefined,
  zeroBalanceNetworkToken: new Balance(0, CurrencyType.networkToken),
}

const BalanceContext =
  createContext<ReturnType<typeof useBalanceHook>>(initialState)
const { Provider } = BalanceContext

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useBalanceHook()}>{children}</Provider>
}

export const useBalance = () => useContext(BalanceContext)

export const balanceToString = (
  balance?: Balance<DataCredits | NetworkTokens | TestNetworkTokens>,
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
      dc: new Balance(accountData.dcBalance || 0, CurrencyType.dataCredit),
      stakedHnt: new Balance(accountData.stakedBalance || 0, currencyType),
      hst: new Balance(accountData.secBalance || 0, CurrencyType.security),
      address: accountData?.address,
      hntBal: accountData.balance,
    }
  }, [accountData])
