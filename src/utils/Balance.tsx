import { NetTypes } from '@helium/address'
import Balance, {
  CurrencyType,
  DataCredits,
  IotTokens,
  MobileTokens,
  NetworkTokens,
  SolTokens,
  TestNetworkTokens,
  Ticker,
} from '@helium/currency'
import { getOraclePrice } from '@helium/currency-utils'
import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { PublicKey } from '@solana/web3.js'
import { round } from 'lodash'
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import CurrencyFormatter from 'react-native-currency-format'
import { useSelector } from 'react-redux'
import usePrevious from '../hooks/usePrevious'
import { useSolana } from '../solana/SolanaProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { syncTokenAccounts } from '../store/slices/balancesSlice'
import { useAppDispatch } from '../store/store'
import { AccountBalance, BalanceInfo, TokenAccount } from '../types/balance'
import StoreAtaBalance from './StoreAtaBalance'
import StoreSolBalance from './StoreSolBalance'
import StoreTokenBalance from './StoreTokenBalance'
import { accountCurrencyType } from './accountUtils'
import { decimalSeparator, groupSeparator } from './i18n'
import { useBalanceHistory } from './useBalanceHistory'
import { usePollTokenPrices } from './usePollTokenPrices'

export const ORACLE_POLL_INTERVAL = 1000 * 15 * 60 // 15 minutes
const useBalanceHook = () => {
  const { currentAccount } = useAccountStorage()
  const { cluster, anchorProvider } = useSolana()
  const { tokenPrices } = usePollTokenPrices()
  const { balanceHistory } = useBalanceHistory()
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo>()
  const prevCluster = usePrevious(cluster)
  const prevSolAddress = usePrevious(currentAccount?.solanaAddress)

  const solanaAddress = useMemo(
    () => currentAccount?.solanaAddress || '',
    [currentAccount],
  )
  const allBalances = useSelector((state: RootState) => state.balances.balances)

  const { convertToCurrency, currency: currencyRaw } = useAppStorage()

  const currency = useMemo(() => currencyRaw?.toLowerCase(), [currencyRaw])

  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!currentAccount?.solanaAddress || !anchorProvider) return

    dispatch(
      syncTokenAccounts({ cluster, acct: currentAccount, anchorProvider }),
    )
  }, [anchorProvider, cluster, currentAccount, dispatch])

  const [oracleDateTime, setOracleDateTime] = useState<Date>()

  const tokenAccounts = useMemo(() => {
    if (!cluster || !anchorProvider) return undefined

    return (
      allBalances?.[cluster]?.[anchorProvider.publicKey.toBase58() as string]
        ?.atas || []
    )
  }, [cluster, anchorProvider, allBalances])

  const { result: oraclePrice } = useAsync(async () => {
    if (!anchorProvider) {
      return
    }
    const oraclePriceRaw = await getOraclePrice({
      tokenType: 'HNT',
      cluster,
      connection: anchorProvider.connection,
    })
    return Balance.fromFloat(
      Number(
        (
          oraclePriceRaw.emaPrice.value -
          oraclePriceRaw.emaConfidence.value * 2
        ).toFixed(5),
      ),
      CurrencyType.usd,
    )
  }, [cluster, anchorProvider?.connection])

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
        accountCurrencyType(currentAccount.address, undefined),
      )
    },
    [currentAccount],
  )

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

  const getBalance = useCallback(
    (mint: PublicKey, atas: Required<TokenAccount>[]) => {
      const mintStr = mint.toBase58()
      const ata = atas.find((a) => a.mint === mintStr)
      return ata?.balance || 0
    },
    [],
  )

  const { result: tokenInfo } = useAsync(async () => {
    const balancesForCluster = allBalances[cluster]
    const accountBalancesForCluster = balancesForCluster[solanaAddress]

    const atas = accountBalancesForCluster?.atas.filter(
      (ata) => !!ata.tokenAccount,
    ) as Required<TokenAccount>[]

    const solToken = accountBalancesForCluster?.sol

    const dcEscrowToken = accountBalancesForCluster?.dcEscrow

    const dcEscrowBalance = new Balance(
      dcEscrowToken?.balance || 0,
      CurrencyType.dataCredit,
    )
    const formattedEscrowDcValue = await CurrencyFormatter.format(
      dcEscrowBalance.toUsd(oraclePrice).floatBalance,
      'usd',
    )

    const solBalance = Balance.fromIntAndTicker(solToken?.balance || 0, 'SOL')
    const solPrice = tokenPrices?.solana?.[currency] || 0
    const solAmount = solBalance?.floatBalance
    const solValue = solPrice * solAmount
    const formattedSolValue = await CurrencyFormatter.format(solValue, currency)

    const hntBalance = Balance.fromIntAndTicker(
      getBalance(HNT_MINT, atas),
      'HNT',
    )
    const hntPrice = tokenPrices?.helium?.[currency] || 0
    const hntAmount = hntBalance?.floatBalance
    const hntValue = hntPrice * hntAmount
    const formattedHntValue = await CurrencyFormatter.format(hntValue, currency)

    const iotBalance = Balance.fromIntAndTicker(
      getBalance(IOT_MINT, atas),
      'IOT',
    )
    const iotPrice = tokenPrices?.['helium-iot']?.[currency] || 0
    const iotAmount = iotBalance?.floatBalance
    const iotValue = iotPrice * iotAmount
    const formattedIotValue = await CurrencyFormatter.format(iotValue, currency)

    const mobileBalance = Balance.fromIntAndTicker(
      getBalance(MOBILE_MINT, atas),
      'MOBILE',
    )
    const mobilePrice = tokenPrices?.['helium-mobile']?.[currency] || 0
    const mobileAmount = mobileBalance?.floatBalance
    const mobileValue = mobilePrice * mobileAmount
    const formattedMobileValue = await CurrencyFormatter.format(
      mobileValue,
      currency,
    )

    const dcBalance = new Balance(
      getBalance(DC_MINT, atas),
      CurrencyType.dataCredit,
    )
    const formattedDcValue = await CurrencyFormatter.format(
      dcBalance.toUsd(oraclePrice).floatBalance,
      'usd',
    )

    const formattedTotal = await CurrencyFormatter.format(
      solValue + hntValue + mobileValue + iotValue,
      currency,
    )

    return {
      atas,
      dcBalance,
      dcEscrowBalance,
      dcEscrowToken,
      formattedDcValue,
      formattedEscrowDcValue,
      formattedHntValue,
      formattedIotValue,
      formattedMobileValue,
      formattedSolValue,
      formattedTotal,
      hntBalance,
      hntValue,
      iotBalance,
      iotValue,
      mobileBalance,
      mobileValue,
      solBalance,
      solToken,
      solValue,
    }
  }, [
    allBalances,
    cluster,
    currency,
    getBalance,
    oraclePrice,
    solanaAddress,
    tokenPrices,
  ])

  // The useAsync does not support stale-while-revalidate, so when
  // it re-renders, the previous result value clears. We're storing
  // the value in `balanceInfo`. We keep the previous value when
  // cluster and solanaAddress stay the same until a new value
  // is available. If cluster or solanaAddress change, we clear
  // `balanceInfo`
  useEffect(() => {
    const shouldClear =
      prevSolAddress !== solanaAddress || prevCluster !== cluster
    if (shouldClear) {
      setBalanceInfo(undefined)
      return
    }

    if (!tokenInfo) {
      return
    }

    setBalanceInfo(tokenInfo)
  }, [cluster, prevCluster, prevSolAddress, solanaAddress, tokenInfo])

  const toCurrencyString = useCallback(
    (
      balance: Balance<NetworkTokens | TestNetworkTokens>,
      ticker: Ticker = 'HNT',
    ): Promise<string> => {
      const defaultResponse = new Promise<string>((resolve) => resolve(''))

      const bal = Balance.fromIntAndTicker(balance.integerBalance, ticker)

      let value = 0
      switch (ticker) {
        case 'HNT':
          value = tokenPrices?.helium[currency] || 0
          break
        case 'SOL':
          value = tokenPrices?.solana[currency] || 0
          break
        case 'IOT':
          value = tokenPrices?.['helium-iot'][currency] || 0
          break
        case 'MOBILE':
          value = tokenPrices?.['helium-mobile'][currency] || 0
          break
      }

      if (!value) return defaultResponse

      return CurrencyFormatter.format(value * bal.floatBalance, currency)
    },
    [currency, tokenPrices],
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
    balanceHistory,
    bonesToBalance,
    dcToNetworkTokens,
    floatToBalance,
    ...balanceInfo,
    intToBalance,
    networkTokensToDc,
    oracleDateTime,
    oraclePrice,
    solanaPrice,
    toCurrencyString,
    toPreferredCurrencyString,
    toUsd,
    tokenAccounts,
  }
}

const initialState = {
  balanceHistory: [] as AccountBalance[],
  bonesToBalance: () => new Balance(0, CurrencyType.networkToken),
  dcBalance: new Balance(0, CurrencyType.dataCredit),
  dcDelegatedBalance: new Balance(0, CurrencyType.dataCredit),
  dcEscrowBalance: new Balance(0, CurrencyType.dataCredit),
  dcToNetworkTokens: () => undefined,
  floatToBalance: () => undefined,
  formattedDcValue: '',
  formattedHntValue: '',
  formattedIotValue: '',
  formattedMobileValue: '',
  formattedSolValue: '',
  formattedTotal: undefined,
  hntBalance: new Balance(0, CurrencyType.networkToken),
  intToBalance: () => undefined,
  iotBalance: new Balance(0, CurrencyType.iot),
  mobileBalance: new Balance(0, CurrencyType.mobile),
  networkTokensToDc: () => undefined,
  oracleDateTime: undefined,
  oraclePrice: undefined,
  solanaPrice: undefined,
  solBalance: new Balance(0, CurrencyType.solTokens),
  solBalancesLoading: false,
  toCurrencyString: () => new Promise<string>((resolve) => resolve('')),
  toPreferredCurrencyString: () =>
    new Promise<string>((resolve) => resolve('')),
  toUsd: () => 0,
  atas: [],
  updating: false,
  solToken: undefined,
  dcEscrowToken: undefined,
  tokenAccounts: undefined,
}
const BalanceContext =
  createContext<ReturnType<typeof useBalanceHook>>(initialState)
const { Provider } = BalanceContext

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
  const balanceHook = useBalanceHook()

  const { atas, dcEscrowToken, solToken } = balanceHook
  const { cluster } = useSolana()
  const prevSolAddress = usePrevious(solToken?.tokenAccount)
  const prevCluster = usePrevious(cluster)
  const clusterChanged = prevCluster && cluster && prevCluster !== cluster
  const addressChanged =
    solToken?.tokenAccount &&
    prevSolAddress &&
    solToken.tokenAccount !== prevSolAddress

  if (clusterChanged || addressChanged) {
    return <>{children}</>
  }

  return (
    <Provider value={balanceHook}>
      {atas?.map((ta) => (
        <StoreAtaBalance key={`${ta.mint}.${ta.tokenAccount}`} {...ta} />
      ))}
      {dcEscrowToken?.tokenAccount && (
        <StoreTokenBalance
          tokenAccount={dcEscrowToken.tokenAccount}
          type="dcEscrow"
        />
      )}
      {solToken?.tokenAccount && (
        <StoreSolBalance solanaAddress={solToken?.tokenAccount} />
      )}

      {children}
    </Provider>
  )
}

export const useBalance = () => useContext(BalanceContext)

export const balanceToString = (
  balance?: Balance<
    | DataCredits
    | NetworkTokens
    | TestNetworkTokens
    | MobileTokens
    | IotTokens
    | SolTokens
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
