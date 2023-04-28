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
import CurrencyFormatter from 'react-native-currency-format'
import { useSelector } from 'react-redux'
import { useAsync } from 'react-async-hook'
import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { useAppDispatch } from '../store/store'
import { accountCurrencyType } from './accountUtils'
import { decimalSeparator, groupSeparator } from './i18n'
import { useSolana } from '../solana/SolanaProvider'
import { TokenAccount, syncTokenAccounts } from '../store/slices/balancesSlice'
import { usePollTokenPrices } from './usePollTokenPrices'
import { useBalanceHistory } from './useBalanceHistory'
import { AccountBalance } from '../types/balance'
import StoreAtaBalance from './StoreAtaBalance'
import StoreTokenBalance from './StoreTokenBalance'
import StoreSolBalance from './StoreSolBalance'

export const ORACLE_POLL_INTERVAL = 1000 * 15 * 60 // 15 minutes
const useBalanceHook = () => {
  const { currentAccount } = useAccountStorage()
  const { cluster, anchorProvider } = useSolana()
  const { tokenPrices } = usePollTokenPrices()
  const { balanceHistory } = useBalanceHistory()

  const solanaAddress = useMemo(
    () => currentAccount?.solanaAddress || '',
    [currentAccount],
  )

  const balancesForCluster = useSelector(
    (state: RootState) => state.balances.balances[cluster],
  )

  const accountBalancesForCluster = useMemo(() => {
    if (!solanaAddress || !balancesForCluster[solanaAddress]) return

    return balancesForCluster[solanaAddress]
  }, [balancesForCluster, solanaAddress])

  const atas = useMemo(() => {
    if (!accountBalancesForCluster?.atas) return []
    return accountBalancesForCluster?.atas.filter(
      (ata) => !!ata.tokenAccount,
    ) as Required<TokenAccount>[]
  }, [accountBalancesForCluster?.atas])

  const solToken = useMemo(
    () => accountBalancesForCluster?.sol,
    [accountBalancesForCluster?.sol],
  )

  const dcEscrowToken = useMemo(
    () => accountBalancesForCluster?.dcEscrow,
    [accountBalancesForCluster?.dcEscrow],
  )

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
    (mint: PublicKey) => {
      const mintStr = mint.toBase58()
      const ata = atas.find((a) => a.mint === mintStr)
      return ata?.balance || 0
    },
    [atas],
  )

  const { result: tokenInfo } = useAsync(async () => {
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

    const hntBalance = Balance.fromIntAndTicker(getBalance(HNT_MINT), 'HNT')
    const hntPrice = tokenPrices?.helium?.[currency] || 0
    const hntAmount = hntBalance?.floatBalance
    const hntValue = hntPrice * hntAmount
    const formattedHntValue = await CurrencyFormatter.format(hntValue, currency)

    const iotBalance = Balance.fromIntAndTicker(getBalance(IOT_MINT), 'IOT')
    const iotPrice = tokenPrices?.['helium-iot']?.[currency] || 0
    const iotAmount = iotBalance?.floatBalance
    const iotValue = iotPrice * iotAmount
    const formattedIotValue = await CurrencyFormatter.format(iotValue, currency)

    const mobileBalance = Balance.fromIntAndTicker(
      getBalance(MOBILE_MINT),
      'MOBILE',
    )
    const mobilePrice = tokenPrices?.['helium-mobile']?.[currency] || 0
    const mobileAmount = mobileBalance?.floatBalance
    const mobileValue = mobilePrice * mobileAmount
    const formattedMobileValue = await CurrencyFormatter.format(
      mobileValue,
      currency,
    )

    const dcBalance = new Balance(getBalance(DC_MINT), CurrencyType.dataCredit)
    const formattedDcValue = await CurrencyFormatter.format(
      dcBalance.toUsd(oraclePrice).floatBalance,
      'usd',
    )

    const totalValue = await CurrencyFormatter.format(
      solValue + hntValue + mobileValue + iotValue,
      currency,
    )

    return {
      hntBalance,
      iotBalance,
      mobileBalance,
      solBalance,
      dcBalance,
      dcEscrowBalance,
      formattedEscrowDcValue,
      formattedDcValue,
      formattedHntValue,
      formattedIotValue,
      formattedMobileValue,
      formattedSolValue,
      hntValue,
      iotValue,
      mobileValue,
      solValue,
      totalValue,
    }
  }, [
    currency,
    tokenPrices,
    cluster,
    oraclePrice,
    getBalance,
    dcEscrowToken?.balance,
    solToken?.balance,
  ])

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
    ...tokenInfo,
    intToBalance,
    networkTokensToDc,
    oracleDateTime,
    oraclePrice,
    solanaPrice,
    toCurrencyString,
    toPreferredCurrencyString,
    toUsd,
    atas,
    solToken,
    dcEscrowToken,
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
  totalValue: undefined,
  toUsd: () => 0,
  atas: [],
  updating: false,
  solToken: undefined,
  dcEscrowToken: undefined,
}
const BalanceContext =
  createContext<ReturnType<typeof useBalanceHook>>(initialState)
const { Provider } = BalanceContext

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
  const balanceHook = useBalanceHook()

  const { atas, dcEscrowToken, solToken } = balanceHook

  return (
    <Provider value={balanceHook}>
      {atas.map((ta) => (
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
