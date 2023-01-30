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
} from '../generated/graphql'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { readBalances } from '../store/slices/solanaSlice'
import {
  useGetMintsQuery,
  useGetTokenPricesQuery,
} from '../store/slices/walletRestApi'
import { useAppDispatch } from '../store/store'
import { accountCurrencyType } from './accountUtils'
import { decimalSeparator, groupSeparator } from './i18n'
import { onAccountChange, removeAccountChangeListener } from './solanaUtils'
import useAppear from '../hooks/useAppear'
import usePrevious from '../hooks/usePrevious'

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
  const [updating, setUpdating] = useState(false)

  const dispatch = useAppDispatch()
  const { data: mints } = useGetMintsQuery(cluster, {
    refetchOnMountOrArgChange: true,
  })

  const { currentData: tokenPrices } = useGetTokenPricesQuery(
    { tokens: 'helium,solana', currency },
    {
      pollingInterval: 60 * 1000,
    },
  )

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

  const solanaBalances = useSelector((state: RootState) => {
    return state.solana.balances
  })

  const [oracleDateTime, setOracleDateTime] = useState<Date>()

  const solAddress = useMemo(
    () => currentAccount?.solanaAddress,
    [currentAccount],
  )

  const solBalances = useMemo(() => {
    if (!solAddress) return

    return solanaBalances[solAddress]
  }, [solAddress, solanaBalances])

  const dispatchSolBalanceUpdate = useCallback(() => {
    if (!currentAccount?.solanaAddress) {
      return
    }

    dispatch(readBalances({ cluster, acct: currentAccount, mints }))
  }, [currentAccount, dispatch, mints, cluster])

  useEffect(() => {
    if (!currentAccount?.solanaAddress || l1Network === 'helium') {
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
    l1Network,
  ])

  useAppear(() => {
    dispatchSolBalanceUpdate()
  })

  const updateVars = useCallback(async () => {
    if (!currentAccount?.address) return

    setUpdating(true)

    await fetchOracle({
      variables: {
        address: currentAccount.address,
      },
    })

    await fetchAccountData({
      variables: {
        address: currentAccount.address,
      },
    })
    setUpdating(false)
  }, [currentAccount, fetchAccountData, fetchOracle])

  const oraclePrice = useMemo(() => {
    if (!tokenPrices?.helium) return

    const heliumPrice = tokenPrices.helium[currency.toLowerCase()]
    return Balance.fromFloat(heliumPrice, CurrencyType.usd)
  }, [currency, tokenPrices])

  const solanaPrice = useMemo(() => {
    if (!tokenPrices?.solana) return

    const price = tokenPrices.solana[currency.toLowerCase()]

    return new Balance(price, CurrencyType.usd)
  }, [currency, tokenPrices])

  useEffect(() => {
    if (!tokenPrices?.helium) {
      setOracleDateTime(new Date())
    }
  }, [tokenPrices])

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

  const networkTokensToDc = useCallback(
    (
      balance: Balance<NetworkTokens | TestNetworkTokens>,
    ): Balance<DataCredits> | undefined => {
      if (!oraclePrice) return

      return balance.toDataCredits(oraclePrice)
    },
    [oraclePrice],
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

  const iotBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.iotBalance || 0
        break

      case 'solana':
        bal = solBalances?.iotBalance ? Number(solBalances.iotBalance) : 0
        break
    }

    return new Balance(bal, CurrencyType.iot)
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
        bal = solBalances?.solBalance ? Number(solBalances.solBalance / 10) : 0
        break
    }

    return new Balance(bal, CurrencyType.solTokens)
  }, [l1Network, solBalances])

  const splTokensBalance = useMemo(() => {
    const balances: { [address: string]: number } = {}

    switch (l1Network) {
      case 'helium':
        break

      case 'solana':
        if (!solBalances?.splTokensBalance) {
          break
        }

        Object.keys(solBalances.splTokensBalance).forEach((address) => {
          if (!solBalances?.splTokensBalance) return

          balances[address] = Number(solBalances.splTokensBalance[address])
        })
        break
    }

    return balances
  }, [l1Network, solBalances])

  const toPreferredCurrencyString = useCallback(
    (
      balance?: Balance<DataCredits | NetworkTokens | TestNetworkTokens>,
      opts?: { maxDecimalPlaces?: number; showTicker?: boolean },
    ): Promise<string> => {
      if (!balance) {
        return new Promise<string>((resolve) => resolve(''))
      }
      const multiplier = tokenPrices?.helium[currency.toLowerCase()] || 0

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
    [convertToCurrency, currency, tokenPrices],
  )

  const toCurrencyString = useCallback(
    (
      balance?: Balance<NetworkTokens | TestNetworkTokens>,
      ticker: Ticker = 'HNT',
    ): Promise<string> => {
      const defaultResponse = new Promise<string>((resolve) => resolve(''))

      let bal = Balance.fromIntAndTicker(0, ticker)
      if (balance?.floatBalance !== undefined && ticker === 'HNT') {
        bal = balance
      }

      if (solBalance?.floatBalance !== undefined && ticker === 'SOL') {
        bal = solBalance
      }

      const tickerPrice =
        ticker === 'HNT' ? tokenPrices?.helium : tokenPrices?.solana

      const multiplier = tickerPrice?.[currency.toLowerCase()] || 0
      if (!multiplier) return defaultResponse

      const convertedValue = multiplier * bal.floatBalance
      return CurrencyFormatter.format(convertedValue, currency)
    },
    [currency, solBalance, tokenPrices],
  )

  const toUsd = useCallback(
    (balance?: Balance<NetworkTokens | TestNetworkTokens>): number => {
      if (!balance) {
        return 0
      }
      const multiplier = tokenPrices?.helium?.usd || 0

      return round(multiplier * (balance?.floatBalance || 0), 2)
    },
    [tokenPrices],
  )

  return {
    bonesToBalance,
    dcBalance,
    dcToNetworkTokens,
    floatToBalance,
    intToBalance,
    networkTokensToDc,
    iotBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    oracleDateTime,
    oraclePrice,
    solanaPrice,
    secBalance,
    solBalance,
    splTokensBalance,
    toCurrencyString,
    toPreferredCurrencyString,
    toUsd,
    updateVars,
    updating,
  }
}

const initialState = {
  bonesToBalance: () => new Balance(0, CurrencyType.networkToken),
  dcBalance: new Balance(0, CurrencyType.dataCredit),
  dcToNetworkTokens: () => undefined,
  floatToBalance: () => undefined,
  intToBalance: () => undefined,
  networkTokensToDc: () => undefined,
  iotBalance: new Balance(0, CurrencyType.iot),
  mobileBalance: new Balance(0, CurrencyType.mobile),
  networkBalance: new Balance(0, CurrencyType.networkToken),
  networkStakedBalance: new Balance(0, CurrencyType.networkToken),
  oracleDateTime: undefined,
  oraclePrice: undefined,
  solanaPrice: undefined,
  secBalance: new Balance(0, CurrencyType.security),
  solBalance: new Balance(0, CurrencyType.solTokens),
  splTokensBalance: {},
  toCurrencyString: () => new Promise<string>((resolve) => resolve('')),
  toPreferredCurrencyString: () =>
    new Promise<string>((resolve) => resolve('')),
  toUsd: () => 0,
  updateVars: () => new Promise<void>((resolve) => resolve()),
  updating: false,
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
