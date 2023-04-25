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
import { useAccount, useTokenAccount } from '@helium/helium-react-hooks'
import { PublicKey } from '@solana/web3.js'
import { AccountLayout } from '@solana/spl-token'
import { useAsync } from 'react-async-hook'
import {
  useAccountLazyQuery,
  useAccountQuery,
  useOracleDataLazyQuery,
} from '../generated/graphql'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { RootState } from '../store/rootReducer'
import { useAppDispatch } from '../store/store'
import { accountCurrencyType } from './accountUtils'
import { decimalSeparator, groupSeparator } from './i18n'
import { useSolana } from '../solana/SolanaProvider'
import { balancesSlice, readTokenBalances } from '../store/slices/balancesSlice'
import { getEscrowTokenAccount } from './solanaUtils'
import { usePollTokenPrices } from './usePollTokenPrices'
import { useBalanceHistory } from './useBalanceHistory'
import { AccountBalance } from '../types/balance'

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

  const tokens = useSelector(
    (state: RootState) => state.balances.tokens[cluster],
  )

  const solTokenAccount = useAccount(
    tokens?.[solanaAddress]?.sol?.tokenAccount
      ? new PublicKey(tokens[solanaAddress].sol.tokenAccount)
      : undefined,
  )

  const hntTokenAccount = useTokenAccount(
    tokens?.[solanaAddress]?.hnt?.tokenAccount
      ? new PublicKey(tokens[solanaAddress].hnt.tokenAccount)
      : undefined,
  )

  const iotTokenAccount = useTokenAccount(
    tokens?.[solanaAddress]?.iot?.tokenAccount
      ? new PublicKey(tokens[solanaAddress].iot.tokenAccount)
      : undefined,
  )

  const mobileTokenAccount = useTokenAccount(
    tokens?.[solanaAddress]?.mobile?.tokenAccount
      ? new PublicKey(tokens[solanaAddress].mobile.tokenAccount)
      : undefined,
  )

  const dcTokenAccount = useTokenAccount(
    tokens?.[solanaAddress]?.dc?.tokenAccount
      ? new PublicKey(tokens[solanaAddress].dc.tokenAccount)
      : undefined,
  )

  const {
    convertToCurrency,
    currency: currencyRaw,
    l1Network,
  } = useAppStorage()
  const currency = useMemo(() => currencyRaw.toLowerCase(), [currencyRaw])
  const [updating, setUpdating] = useState(false)

  const dispatch = useAppDispatch()

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

  const updateTokenBalance = useCallback(
    ({
      type,
      data,
    }: {
      type: 'sol' | 'mobile' | 'dc' | 'iot' | 'hnt'
      data?: Buffer
    }) => {
      if (!data?.length || !currentAccount?.solanaAddress) return

      const decoded = AccountLayout.decode(data)
      dispatch(
        balancesSlice.actions.updateTokenBalance({
          cluster,
          solanaAddress: currentAccount?.solanaAddress,
          balance: Number(decoded.amount),
          type,
        }),
      )
    },
    [cluster, currentAccount?.solanaAddress, dispatch],
  )

  useEffect(() => {
    if (!hntTokenAccount.account?.data || !currentAccount?.solanaAddress) return

    updateTokenBalance({ type: 'hnt', data: hntTokenAccount.account.data })
  }, [
    cluster,
    currentAccount?.solanaAddress,
    hntTokenAccount,
    updateTokenBalance,
  ])

  useEffect(() => {
    if (!solTokenAccount.account?.data || !currentAccount?.solanaAddress) return

    updateTokenBalance({ type: 'sol', data: solTokenAccount.account.data })
  }, [
    cluster,
    currentAccount?.solanaAddress,
    solTokenAccount,
    updateTokenBalance,
  ])

  useEffect(() => {
    if (!iotTokenAccount.account?.data || !currentAccount?.solanaAddress) return

    updateTokenBalance({ type: 'iot', data: iotTokenAccount.account.data })
  }, [
    cluster,
    currentAccount?.solanaAddress,
    iotTokenAccount,
    updateTokenBalance,
  ])

  useEffect(() => {
    if (!mobileTokenAccount.account?.data || !currentAccount?.solanaAddress)
      return

    updateTokenBalance({
      type: 'mobile',
      data: mobileTokenAccount.account.data,
    })
  }, [
    cluster,
    currentAccount?.solanaAddress,
    mobileTokenAccount,
    updateTokenBalance,
  ])

  useEffect(() => {
    if (!dcTokenAccount.account?.data || !currentAccount?.solanaAddress) return

    updateTokenBalance({
      type: 'dc',
      data: dcTokenAccount.account.data,
    })
  }, [
    cluster,
    currentAccount?.solanaAddress,
    dcTokenAccount,
    updateTokenBalance,
  ])

  useEffect(() => {
    if (!currentAccount?.solanaAddress || !anchorProvider) return

    dispatch(
      readTokenBalances({ cluster, acct: currentAccount, anchorProvider }),
    )
  }, [anchorProvider, cluster, currentAccount, dispatch])

  const [oracleDateTime, setOracleDateTime] = useState<Date>()

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

  const dcReceivedBalance = useMemo(() => {
    if (!accountData?.account?.address) {
      return new Balance(0, CurrencyType.dataCredit)
    }

    const escrowAccount = getEscrowTokenAccount(
      accountData?.account?.address,
    ).toBase58()

    const amount = tokens[solanaAddress]?.[escrowAccount]?.balance || 0

    return new Balance(amount, CurrencyType.dataCredit)
  }, [accountData?.account?.address, solanaAddress, tokens])

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

  const { result: tokenInfo } = useAsync(async () => {
    const bals = tokens || {}
    const balances = {
      sol: new Balance(
        bals?.[solanaAddress]?.sol?.balance || 0,
        CurrencyType.solTokens,
      ),
      dc: new Balance(
        bals?.[solanaAddress]?.dc?.balance || 0,
        CurrencyType.dataCredit,
      ),
      hnt: new Balance(
        bals?.[solanaAddress]?.hnt?.balance || 0,
        CurrencyType.networkToken,
      ),
      mobile: new Balance(
        bals?.[solanaAddress]?.mobile?.balance || 0,
        CurrencyType.mobile,
      ),
      iot: new Balance(
        bals?.[solanaAddress]?.iot?.balance || 0,
        CurrencyType.iot,
      ),
    }

    const solPrice = tokenPrices?.solana?.[currency] || 0
    const solAmount = balances.sol.floatBalance
    const solValue = solPrice * solAmount
    const formattedSolValue = await CurrencyFormatter.format(solValue, currency)

    const hntPrice = tokenPrices?.helium?.[currency] || 0
    const hntAmount = balances.hnt.floatBalance
    const hntValue = hntPrice * hntAmount
    const formattedHntValue = await CurrencyFormatter.format(hntValue, currency)

    const iotPrice = tokenPrices?.['helium-iot']?.[currency] || 0
    const iotAmount = balances.iot.floatBalance
    const iotValue = iotPrice * iotAmount
    const formattedIotValue = await CurrencyFormatter.format(iotValue, currency)

    const mobilePrice = tokenPrices?.['helium-mobile']?.[currency] || 0
    const mobileAmount = balances.mobile.floatBalance
    const mobileValue = mobilePrice * mobileAmount
    const formattedMobileValue = await CurrencyFormatter.format(
      mobileValue,
      currency,
    )

    const usdValue = balances.dc?.toUsd(oraclePrice).floatBalance
    const formattedDcValue = await CurrencyFormatter.format(usdValue, 'usd')

    const totalValue = await CurrencyFormatter.format(
      solValue + hntValue + mobileValue + iotValue,
      currency,
    )

    return {
      balances,
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
  }, [currency, currentAccount?.address, tokenPrices])

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
    dcBalance: tokenInfo?.balances.dc,
    dcReceivedBalance,
    dcToNetworkTokens,
    floatToBalance,
    hntBalance: tokenInfo?.balances.hnt,
    ...tokenInfo,
    intToBalance,
    iotBalance: tokenInfo?.balances.iot,
    mobileBalance: tokenInfo?.balances.mobile,
    networkTokensToDc,
    oracleDateTime,
    oraclePrice,
    solanaPrice,
    solBalance: tokenInfo?.balances.sol,
    toCurrencyString,
    toPreferredCurrencyString,
    toUsd,
    updateVars,
    updating,
  }
}

const initialState = {
  balanceHistory: [] as AccountBalance[],
  bonesToBalance: () => new Balance(0, CurrencyType.networkToken),
  dcToNetworkTokens: () => undefined,
  formattedHntValue: '',
  formattedSolValue: '',
  formattedDcValue: '',
  formattedIotValue: '',
  formattedMobileValue: '',
  floatToBalance: () => undefined,
  intToBalance: () => undefined,
  networkTokensToDc: () => undefined,
  totalValue: undefined,
  iotBalance: new Balance(0, CurrencyType.iot),
  mobileBalance: new Balance(0, CurrencyType.mobile),
  hntBalance: new Balance(0, CurrencyType.networkToken),
  oracleDateTime: undefined,
  oraclePrice: undefined,
  solanaPrice: undefined,
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
