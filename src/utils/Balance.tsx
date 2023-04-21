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
import useAppear from '@hooks/useAppear'
import usePrevious from '@hooks/usePrevious'
import {
  useAccount,
  useMint,
  useTokenAccount,
} from '@helium/helium-react-hooks'
import {
  DC_MINT,
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  toNumber,
} from '@helium/spl-utils'
import { BN } from 'bn.js'
import { PublicKey } from '@solana/web3.js'
import { AccountLayout } from '@solana/spl-token'
import {
  useAccountLazyQuery,
  useAccountQuery,
  useOracleDataLazyQuery,
} from '../generated/graphql'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { readBalances, solanaSlice } from '../store/slices/solanaSlice'
import { useGetTokenPricesQuery } from '../store/slices/walletRestApi'
import { useAppDispatch } from '../store/store'
import { accountCurrencyType } from './accountUtils'
import { decimalSeparator, groupSeparator } from './i18n'
import {
  onAccountChange,
  removeAccountChangeListener,
  getEscrowTokenAccount,
} from './solanaUtils'
import { Mints } from './constants'
import { useSolana } from '../solana/SolanaProvider'

export const ORACLE_POLL_INTERVAL = 1000 * 15 * 60 // 15 minutes
const useBalanceHook = () => {
  const { currentAccount } = useAccountStorage()
  const prevAccount = usePrevious(currentAccount)
  const accountSubscriptionId = useRef<number>()
  const {
    convertToCurrency,
    currency: rawCurrency,
    l1Network,
  } = useAppStorage()
  const currency = useMemo(() => rawCurrency?.toLowerCase(), [rawCurrency])
  const { cluster, anchorProvider } = useSolana()
  const prevCluster = usePrevious(cluster)
  const [updating, setUpdating] = useState(false)

  const dispatch = useAppDispatch()

  const { currentData: tokenPrices } = useGetTokenPricesQuery(
    { tokens: 'helium,solana,helium-mobile,helium-iot', currency },
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

  const { balances: solanaBalances, tokenAccounts } = useSelector(
    (state: RootState) => state.solana,
  )

  const solAddress = useMemo(
    () => currentAccount?.solanaAddress,
    [currentAccount],
  )

  const allTokenAccounts = useMemo(() => {
    if (!solAddress) return

    return tokenAccounts[solAddress]
  }, [solAddress, tokenAccounts])

  const [oracleDateTime, setOracleDateTime] = useState<Date>()

  const solBalances = useMemo(() => {
    if (!solAddress) return

    return solanaBalances[solAddress]
  }, [solAddress, solanaBalances])

  const solBalancesLoading = useMemo(() => {
    if (!solBalances) return

    return solBalances.loading
  }, [solBalances])

  // On mount reset the loading state for the balances
  useEffect(() => {
    if (!solAddress) return
    dispatch(solanaSlice.actions.resetBalancesLoading(solAddress))
  }, [dispatch, solAddress])

  const dispatchSolBalanceUpdate = useCallback(() => {
    if (!currentAccount?.solanaAddress || !Mints || !anchorProvider) {
      return
    }
    dispatch(readBalances({ anchorProvider, acct: currentAccount }))
  }, [currentAccount, dispatch, anchorProvider])

  const { info: mobileMint } = useMint(MOBILE_MINT)
  const { info: iotMint } = useMint(IOT_MINT)

  const solTokenAccount = useAccount(
    solAddress ? new PublicKey(solAddress) : undefined,
  )

  const hntTokenAccount = useTokenAccount(
    allTokenAccounts && allTokenAccounts[HNT_MINT.toBase58()]
      ? new PublicKey(allTokenAccounts[HNT_MINT.toBase58()])
      : undefined,
  )

  const dcTokenAccount = useTokenAccount(
    allTokenAccounts && allTokenAccounts[DC_MINT.toBase58()]
      ? new PublicKey(allTokenAccounts[DC_MINT.toBase58()])
      : undefined,
  )

  const iotTokenAccount = useTokenAccount(
    allTokenAccounts && allTokenAccounts[IOT_MINT.toBase58()]
      ? new PublicKey(allTokenAccounts[IOT_MINT.toBase58()])
      : undefined,
  )

  const mobileTokenAccount = useTokenAccount(
    allTokenAccounts && allTokenAccounts[MOBILE_MINT.toBase58()]
      ? new PublicKey(allTokenAccounts[MOBILE_MINT.toBase58()])
      : undefined,
  )

  useEffect(() => {
    if (
      !currentAccount?.solanaAddress ||
      l1Network === 'helium' ||
      !anchorProvider
    ) {
      return
    }

    if (prevAccount !== currentAccount || cluster !== prevCluster) {
      dispatchSolBalanceUpdate()
      const subId = onAccountChange(
        anchorProvider,
        currentAccount?.solanaAddress,
        dispatchSolBalanceUpdate,
      )
      if (accountSubscriptionId.current !== undefined) {
        removeAccountChangeListener(
          anchorProvider,
          accountSubscriptionId.current,
        )
      }
      accountSubscriptionId.current = subId
    }
  }, [
    anchorProvider,
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

    const heliumPrice = tokenPrices.helium[currency]
    return Balance.fromFloat(heliumPrice, CurrencyType.usd)
  }, [currency, tokenPrices])

  const solanaPrice = useMemo(() => {
    if (!tokenPrices?.solana) return

    const price = tokenPrices.solana[currency]

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
        accountCurrencyType(currentAccount.address, undefined, l1Network),
      )
    },
    [currentAccount, l1Network],
  )

  const getTokenAccountData = useCallback((tokenAccount) => {
    if (!tokenAccount.account) return
    return AccountLayout.decode(tokenAccount.account?.data)
  }, [])

  const networkBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.balance || 0
        break

      case 'solana':
        bal =
          allTokenAccounts && allTokenAccounts[HNT_MINT.toBase58()]
            ? Number(getTokenAccountData(hntTokenAccount)?.amount || 0)
            : 0
        break
    }

    return new Balance(bal, accountCurrencyType(currentAccount?.address))
  }, [
    accountData,
    currentAccount,
    l1Network,
    getTokenAccountData,
    hntTokenAccount,
    allTokenAccounts,
  ])

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
  }, [currentAccount, solBalances, accountData, l1Network])

  const mobileBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.mobileBalance || 0
        break

      case 'solana':
        bal =
          allTokenAccounts && allTokenAccounts[MOBILE_MINT.toBase58()]
            ? toNumber(
                new BN(
                  getTokenAccountData(mobileTokenAccount)?.amount.toString() ||
                    0,
                ),
                mobileMint?.info.decimals || 6,
              )
            : 0
        break
    }

    return l1Network === 'helium'
      ? new Balance(bal, CurrencyType.mobile)
      : Balance.fromFloatAndTicker(bal, 'MOBILE')
  }, [
    accountData,
    l1Network,
    getTokenAccountData,
    mobileMint,
    mobileTokenAccount,
    allTokenAccounts,
  ])

  const mobileSolBalance = useMemo(() => {
    /* TODO: Add new solana variation for IOT and MOBILE in @helium/currency that supports
     6 decimals and pulls from mint instead of ticker.
    */
    return allTokenAccounts && allTokenAccounts[MOBILE_MINT.toBase58()]
      ? toNumber(
          new BN(
            getTokenAccountData(mobileTokenAccount)?.amount.toString() || 0,
          ),
          mobileMint?.info.decimals || 6,
        )
      : 0
  }, [mobileMint, getTokenAccountData, mobileTokenAccount, allTokenAccounts])

  const iotBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.iotBalance || 0
        break

      case 'solana':
        bal =
          allTokenAccounts && allTokenAccounts[IOT_MINT.toBase58()]
            ? toNumber(
                new BN(
                  getTokenAccountData(iotTokenAccount)?.amount.toString() || 0,
                ),
                iotMint?.info.decimals || 6,
              )
            : 0
        break
    }

    return l1Network === 'helium'
      ? new Balance(bal, CurrencyType.iot)
      : Balance.fromFloatAndTicker(bal, 'IOT')
  }, [
    accountData,
    l1Network,
    iotTokenAccount,
    iotMint,
    getTokenAccountData,
    allTokenAccounts,
  ])

  const iotSolBalance = useMemo(() => {
    /* TODO: Add new solana variation for IOT and MOBILE in @helium/currency that supports
     6 decimals and pulls from mint instead of ticker.
    */
    return allTokenAccounts && allTokenAccounts[IOT_MINT.toBase58()]
      ? toNumber(
          new BN(getTokenAccountData(iotTokenAccount)?.amount.toString() || 0),
          iotMint?.info.decimals || 6,
        )
      : 0
  }, [iotTokenAccount, iotMint, getTokenAccountData, allTokenAccounts])

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
  }, [solBalances, accountData, l1Network])

  const dcReceivedBalance = useMemo(() => {
    if (!accountData?.account?.address) {
      return new Balance(0, CurrencyType.dataCredit)
    }

    const escrowAccount = getEscrowTokenAccount(
      accountData?.account?.address,
    ).toBase58()

    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = 0
        break

      case 'solana':
        bal = solBalances?.dcReceived
          ? Number(getTokenAccountData(escrowAccount)?.amount || 0)
          : 0
        break
    }

    return new Balance(bal, CurrencyType.dataCredit)
  }, [
    accountData?.account?.address,
    getTokenAccountData,
    l1Network,
    solBalances?.dcReceived,
  ])

  const dcBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        bal = accountData?.account?.dcBalance || 0
        break

      case 'solana':
        bal =
          allTokenAccounts && allTokenAccounts[DC_MINT.toBase58()]
            ? Number(getTokenAccountData(dcTokenAccount)?.amount || 0)
            : 0
        break
    }

    return new Balance(bal, CurrencyType.dataCredit)
  }, [
    accountData,
    l1Network,
    dcTokenAccount,
    getTokenAccountData,
    allTokenAccounts,
  ])

  const solBalance = useMemo(() => {
    let bal = 0
    switch (l1Network) {
      case 'helium':
        break

      case 'solana':
        bal = Number(solTokenAccount.account?.lamports || 0)
        break
    }

    return new Balance(bal, CurrencyType.solTokens)
  }, [solTokenAccount, l1Network])

  const toPreferredCurrencyString = useCallback(
    (
      balance?: Balance<DataCredits | NetworkTokens | TestNetworkTokens>,
      opts?: { maxDecimalPlaces?: number; showTicker?: boolean },
    ): Promise<string> => {
      if (!balance) {
        return new Promise<string>((resolve) => resolve(''))
      }
      const multiplier = tokenPrices?.helium[currency] || 0

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

  const totalBalance = useCallback((): Promise<string> => {
    let bal = 0

    if (networkBalance?.floatBalance !== undefined) {
      bal +=
        networkBalance.floatBalance * (tokenPrices?.helium?.[currency] || 0)
    }

    if (solBalance?.floatBalance !== undefined) {
      bal += solBalance.floatBalance * (tokenPrices?.solana?.[currency] || 0)
    }

    if (iotBalance?.floatBalance !== undefined) {
      const iotPrice = tokenPrices?.['helium-iot']?.[currency]
      bal += iotBalance.floatBalance * (iotPrice || 0)
    }

    if (mobileBalance?.floatBalance !== undefined) {
      const mobilePrice = tokenPrices?.['helium-mobile']?.[currency]
      bal += mobileBalance.floatBalance * (mobilePrice || 0)
    }

    return CurrencyFormatter.format(bal, currency)
  }, [
    currency,
    solBalance,
    tokenPrices,
    iotBalance,
    mobileBalance,
    networkBalance,
  ])

  const toCurrencyString = useCallback(
    (
      balance?: Balance<NetworkTokens | TestNetworkTokens>,
      ticker: Ticker = 'HNT',
    ): Promise<string> => {
      const defaultResponse = new Promise<string>((resolve) => resolve(''))

      let bal = Balance.fromIntAndTicker(0, ticker)
      let tickerPrice = tokenPrices?.helium

      if (balance?.floatBalance !== undefined && ticker === 'HNT') {
        bal = balance
      }

      if (solBalance?.floatBalance !== undefined && ticker === 'SOL') {
        tickerPrice = tokenPrices?.solana
        bal = solBalance
      }

      if (iotBalance?.floatBalance !== undefined && ticker === 'IOT') {
        tickerPrice = tokenPrices ? tokenPrices['helium-iot'] : undefined
        bal = iotBalance
      }

      if (mobileBalance?.floatBalance !== undefined && ticker === 'MOBILE') {
        tickerPrice = tokenPrices ? tokenPrices['helium-mobile'] : undefined
        bal = mobileBalance
      }

      const multiplier = tickerPrice?.[currency] || 0
      if (!multiplier) return defaultResponse

      const convertedValue = multiplier * bal.floatBalance
      return CurrencyFormatter.format(convertedValue, currency)
    },
    [currency, solBalance, tokenPrices, iotBalance, mobileBalance],
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
    dcToNetworkTokens,
    floatToBalance,
    intToBalance,
    networkTokensToDc,
    totalBalance,
    iotBalance,
    iotSolBalance,
    mobileSolBalance,
    mobileBalance,
    networkBalance,
    networkStakedBalance,
    oracleDateTime,
    oraclePrice,
    solanaPrice,
    secBalance,
    solBalance,
    dcBalance,
    dcReceivedBalance,
    toCurrencyString,
    toPreferredCurrencyString,
    toUsd,
    updateVars,
    updating,
    tokenAccounts: allTokenAccounts,
    solBalancesLoading,
  }
}

const initialState = {
  bonesToBalance: () => new Balance(0, CurrencyType.networkToken),
  dcToNetworkTokens: () => undefined,
  floatToBalance: () => undefined,
  intToBalance: () => undefined,
  networkTokensToDc: () => undefined,
  totalBalance: () => new Promise<string>((resolve) => resolve('')),
  iotBalance: new Balance(0, CurrencyType.iot),
  iotSolBalance: 0,
  mobileSolBalance: 0,
  mobileBalance: new Balance(0, CurrencyType.mobile),
  networkBalance: new Balance(0, CurrencyType.networkToken),
  networkStakedBalance: new Balance(0, CurrencyType.networkToken),
  oracleDateTime: undefined,
  oraclePrice: undefined,
  solanaPrice: undefined,
  secBalance: new Balance(0, CurrencyType.security),
  solBalance: new Balance(0, CurrencyType.solTokens),
  dcBalance: new Balance(0, CurrencyType.dataCredit),
  dcReceivedBalance: new Balance(0, CurrencyType.dataCredit),
  dcDelegatedBalance: new Balance(0, CurrencyType.dataCredit),
  toCurrencyString: () => new Promise<string>((resolve) => resolve('')),
  toPreferredCurrencyString: () =>
    new Promise<string>((resolve) => resolve('')),
  toUsd: () => 0,
  updateVars: () => new Promise<void>((resolve) => resolve()),
  updating: false,
  tokenAccounts: {},
  solBalancesLoading: false,
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
