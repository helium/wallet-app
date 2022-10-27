import { NetTypes } from '@helium/address'
import Balance, {
  CurrencyType,
  DataCredits,
  IotTokens,
  MobileTokens,
  NetworkTokens,
  TestNetworkTokens,
  Ticker,
} from '@helium/currency'
import { round } from 'lodash'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import CurrencyFormatter from 'react-native-currency-format'
import { useSelector } from 'react-redux'
import {
  useAccountLazyQuery,
  useAccountQuery,
  useOracleDataLazyQuery,
  useOracleDataQuery,
} from '../generated/graphql'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { readBalances } from '../store/slices/solanaSlice'
import { useGetMintsQuery } from '../store/slices/walletRestApi'
import { useAppDispatch } from '../store/store'
import { accountCurrencyType } from './accountUtils'
import { CoinGeckoPrices, getCurrentPrices } from './coinGeckoClient'
import { decimalSeparator, groupSeparator } from './i18n'
import { onAccountChange, removeAccountChangeListener } from './solanaUtils'
import useAppear from './useAppear'
import usePrevious from './usePrevious'

export const ORACLE_POLL_INTERVAL = 1000 * 15 * 60 // 15 minutes
const useBalanceHook = () => {
  const { currentAccount } = useAccountStorage()
  const prevAccount = usePrevious(currentAccount)
  const accountSubscriptionId = useRef<number>()
  const {
    convertToCurrency,
    currency,
    l1Network,
    solanaNetwork: cluster,
  } = useAppStorage()
  const prevCluster = usePrevious(cluster)

  const dispatch = useAppDispatch()
  const { data: mints } = useGetMintsQuery(cluster)

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
    pollInterval: 30000,
  })

  const [fetchAccountData] = useAccountLazyQuery()

  const solanaBalances = useSelector(
    (state: RootState) => state.solana.balances,
  )

  const prevLoadingOracle = usePrevious(loadingOracle)
  const [oracleDateTime, setOracleDateTime] = useState<Date>()
  const [coinGeckoPrices, setCoinGeckoPrices] = useState<CoinGeckoPrices>()

  const updateCoinGeckoPrices = useCallback(
    () => getCurrentPrices().then(setCoinGeckoPrices),
    [],
  )
  const solAddress = useMemo(
    () => currentAccount?.solanaAddress,
    [currentAccount],
  )

  const solBalances = useMemo(() => {
    if (!solAddress) return

    return solanaBalances[solAddress]
  }, [solAddress, solanaBalances])

  const dispatchSolBalanceUpdate = useCallback(() => {
    if (!currentAccount?.solanaAddress || !mints) {
      return
    }
    dispatch(readBalances({ cluster, acct: currentAccount, mints }))
  }, [currentAccount, dispatch, mints, cluster])

  useEffect(() => {
    if (!currentAccount?.solanaAddress) {
      return
    }

    if (prevAccount !== currentAccount || cluster !== prevCluster) {
      dispatchSolBalanceUpdate()
      const subId = onAccountChange(
        cluster,
        currentAccount?.solanaAddress,
        dispatchSolBalanceUpdate,
      )
      if (accountSubscriptionId.current !== undefined) {
        removeAccountChangeListener(cluster, accountSubscriptionId.current)
      }
      accountSubscriptionId.current = subId
    }
  }, [
    currentAccount,
    dispatch,
    dispatchSolBalanceUpdate,
    prevAccount,
    prevCluster,
    cluster,
  ])

  useAppear(() => {
    dispatchSolBalanceUpdate()
    updateCoinGeckoPrices()
  })

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

  const floatToBalance = useCallback(
    (value: number, ticker: Ticker) => {
      if (!currentAccount) {
        console.warn('Cannot convert float to balance for nil account')
        return
      }
      return Balance.fromFloatAndTicker(value, ticker)
    },
    [currentAccount],
  )

  const bonesToBalance = useCallback(
    (v: number | undefined | null, ticker: Ticker | null | undefined) => {
      return Balance.fromIntAndTicker(v || 0, ticker || 'HNT')
    },
    [],
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

  const networkBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.balance || 0
        break

      case 'solana':
        bal = solBalances?.hntBalance ? Number(solBalances.hntBalance) : 0
        break
    }

    return new Balance(bal, accountCurrencyType(currentAccount?.address))
  }, [accountData, currentAccount, l1Network, solBalances])

  const networkStakedBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.stakedBalance || 0
        break

      case 'solana':
        bal = solBalances?.stakedBalance ? Number(solBalances.stakedBalance) : 0
        break
    }

    return new Balance(bal, accountCurrencyType(currentAccount?.address))
  }, [accountData, currentAccount, l1Network, solBalances])

  const mobileBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.mobileBalance || 0
        break

      case 'solana':
        bal = solBalances?.mobileBalance ? Number(solBalances.mobileBalance) : 0
        break
    }

    return new Balance(bal, CurrencyType.mobile)
  }, [accountData, l1Network, solBalances])

  const secBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.secBalance || 0
        break

      case 'solana':
        bal = solBalances?.secBalance ? Number(solBalances.secBalance) : 0
        break
    }

    return new Balance(bal, CurrencyType.security)
  }, [accountData, l1Network, solBalances])

  const dcBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.dcBalance || 0
        break

      case 'solana':
        bal = solBalances?.dcBalance ? Number(solBalances.dcBalance) : 0
        break
    }

    return new Balance(bal, CurrencyType.dataCredit)
  }, [accountData, l1Network, solBalances])

  const solBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        break

      case 'solana':
        bal = solBalances?.solBalance ? Number(solBalances.solBalance) : 0
        break
    }

    return new Balance(bal, CurrencyType.solTokens)
  }, [l1Network, solBalances])

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
    bonesToBalance,
    dcBalance,
    dcToNetworkTokens,
    floatToBalance,
    intToBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    oracleDateTime,
    oraclePrice,
    secBalance,
    solBalance,
    toCurrencyString,
    toPreferredCurrencyString,
    toUsd,
    updateVars,
  }
}

const initialState = {
  bonesToBalance: () => new Balance(0, CurrencyType.networkToken),
  dcBalance: new Balance(0, CurrencyType.dataCredit),
  dcToNetworkTokens: () => undefined,
  floatToBalance: () => undefined,
  intToBalance: () => undefined,
  mobileBalance: new Balance(0, CurrencyType.mobile),
  networkBalance: new Balance(0, CurrencyType.networkToken),
  networkStakedBalance: new Balance(0, CurrencyType.networkToken),
  oracleDateTime: undefined,
  oraclePrice: undefined,
  secBalance: new Balance(0, CurrencyType.security),
  solBalance: new Balance(0, CurrencyType.solTokens),
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
