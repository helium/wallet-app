import { getOraclePrice } from '@helium/currency-utils'
import {
  DC_MINT,
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  toBN,
  toNumber,
} from '@helium/spl-utils'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useVisibleTokens } from '@storage/TokensProvider'
import BN from 'bn.js'
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
import { humanReadable } from './solanaUtils'
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

  const { currency: currencyRaw } = useAppStorage()

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
    if (!cluster || !anchorProvider || !anchorProvider.publicKey)
      return undefined

    return (
      allBalances?.[cluster]?.[anchorProvider.publicKey.toBase58() as string]
        ?.atas || []
    )
  }, [cluster, anchorProvider, allBalances])

  const { result: hntToDcPrice } = useAsync(async () => {
    if (!anchorProvider) {
      return
    }

    const oraclePriceRaw = await getOraclePrice({
      tokenType: 'HNT',
      cluster,
      connection: anchorProvider.connection,
    })

    return oraclePriceRaw
      ? new BN(
          (oraclePriceRaw.priceMessage.emaPrice.toNumber() -
            oraclePriceRaw.priceMessage.emaConf.toNumber() * 2) *
            10 ** oraclePriceRaw.priceMessage.exponent *
            100000,
        )
      : new BN(0)
  }, [cluster, anchorProvider?.connection])

  const solanaPrice = useMemo(() => {
    if (!tokenPrices?.solana) return

    return tokenPrices.solana[currency]
  }, [currency, tokenPrices])

  useEffect(() => {
    if (!tokenPrices?.helium) {
      setOracleDateTime(new Date())
    }
  }, [tokenPrices])

  const dcToNetworkTokens = useCallback(
    (dcBalance: BN): BN | undefined => {
      if (!hntToDcPrice) return
      return toBN(dcBalance.toNumber() / hntToDcPrice.toNumber(), 8)
    },
    [hntToDcPrice],
  )

  const networkTokensToDc = useCallback(
    (balance: BN): BN | undefined => {
      if (!hntToDcPrice) return
      return balance.mul(hntToDcPrice)
    },
    [hntToDcPrice],
  )

  const getBalance = useCallback(
    (mint: PublicKey, atas: Required<TokenAccount>[]) => {
      const mintStr = mint.toBase58()
      const ata = atas.find((a) => a.mint === mintStr)
      return new BN(ata?.balance || 0)
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

    const solBalance = solToken?.balance || 0
    const solPrice = tokenPrices?.solana?.[currency] || 0
    const solValue = solPrice * (solBalance / LAMPORTS_PER_SOL)
    const formattedSolValue = await CurrencyFormatter.format(solValue, currency)

    const hntBalance = getBalance(HNT_MINT, atas)
    const hntPrice = tokenPrices?.helium?.[currency] || 0
    const hntValue = hntPrice * toNumber(hntBalance, 8)
    const formattedHntValue = await CurrencyFormatter.format(hntValue, currency)

    const iotBalance = getBalance(IOT_MINT, atas)
    const iotPrice = tokenPrices?.['helium-iot']?.[currency] || 0
    const iotValue = iotPrice * toNumber(iotBalance, 6)
    const formattedIotValue = await CurrencyFormatter.format(iotValue, currency)

    const mobileBalance = getBalance(MOBILE_MINT, atas)
    const mobilePrice = tokenPrices?.['helium-mobile']?.[currency] || 0
    const mobileValue = mobilePrice * toNumber(mobileBalance, 6)
    const formattedMobileValue = await CurrencyFormatter.format(
      mobileValue,
      currency,
    )

    const dcBalance = new BN(getBalance(DC_MINT, atas))
    const formattedDcValue = humanReadable(dcBalance, 5)

    const formattedTotal = await CurrencyFormatter.format(
      solValue + hntValue + mobileValue + iotValue,
      currency,
    )

    return {
      atas,
      formattedDcValue,
      formattedHntValue,
      formattedIotValue,
      formattedMobileValue,
      formattedSolValue,
      formattedTotal,
    }
  }, [
    allBalances,
    cluster,
    currency,
    getBalance,
    hntToDcPrice,
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setBalanceInfo(tokenInfo)
  }, [cluster, prevCluster, prevSolAddress, solanaAddress, tokenInfo])

  return {
    balanceHistory,
    dcToNetworkTokens,
    ...balanceInfo,
    networkTokensToDc,
    oracleDateTime,
    oraclePrice: hntToDcPrice,
    solanaPrice,
    tokenAccounts,
  }
}

const initialState = {
  balanceHistory: [] as AccountBalance[],
  dcToNetworkTokens: () => undefined,
  formattedDcValue: '',
  formattedHntValue: '',
  formattedIotValue: '',
  formattedMobileValue: '',
  formattedSolValue: '',
  formattedTotal: undefined,
  networkTokensToDc: () => undefined,
  oracleDateTime: undefined,
  oraclePrice: undefined,
  solanaPrice: undefined,
  solBalancesLoading: false,
  atas: [],
  updating: false,
  tokenAccounts: undefined,
}
const BalanceContext =
  createContext<ReturnType<typeof useBalanceHook>>(initialState)
const { Provider } = BalanceContext

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
  const balanceHook = useBalanceHook()

  const { visibleTokens } = useVisibleTokens()
  const { atas } = balanceHook
  const { cluster } = useSolana()
  const prevCluster = usePrevious(cluster)
  const clusterChanged = prevCluster && cluster && prevCluster !== cluster

  if (clusterChanged) {
    return <>{children}</>
  }

  return (
    <Provider value={balanceHook}>
      {atas
        ?.filter((ta) => visibleTokens.has(ta.mint))
        .map((ta) => (
          <StoreAtaBalance key={`${ta.mint}.${ta.tokenAccount}`} {...ta} />
        ))}

      {children}
    </Provider>
  )
}

export const useBalance = () => useContext(BalanceContext)
