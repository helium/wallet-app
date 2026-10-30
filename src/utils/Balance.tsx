import { getOraclePrice } from '@helium/currency-utils'
import {
  DC_MINT,
  HNT_MINT,
  IOT_MINT,
  MOBILE_MINT,
  toBN,
  toNumber,
} from '@helium/spl-utils'
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { useVisibleTokens } from '@storage/TokensProvider'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import BN from 'bn.js'
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react'
import usePrevious from '../hooks/usePrevious'
import { useSolana } from '../solana/SolanaProvider'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import { useAppStorage } from '../storage/AppStorageProvider'
import { AccountBalance, BalanceInfo, TokenAccount } from '../types/balance'
import StoreAtaBalance from './StoreAtaBalance'
import { syncTokenAccounts, tokenAccountsQueryOptions } from './balances'
import { useLanguage } from './i18n'
import {
  ORACLE_FETCH_TIMEOUT,
  ORACLE_MAX_AGE,
  ORACLE_POLL_INTERVAL,
  ORACLE_RETRY_INTERVAL,
  OraclePrice,
  isOraclePriceFresh,
  withTimeout,
} from './oraclePrice'
import { humanReadable } from './solanaUtils'
import { useBalanceHistory } from './useBalanceHistory'
import { usePollTokenPrices } from './usePollTokenPrices'

const useBalanceHook = () => {
  const { currentAccount } = useAccountStorage()
  const { cluster, anchorProvider } = useSolana()
  const { tokenPrices } = usePollTokenPrices()
  const { balanceHistory } = useBalanceHistory()
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo>()

  const solanaAddress = useMemo(
    () => currentAccount?.solanaAddress || '',
    [currentAccount],
  )
  // Only syncTokenAccounts fetches; this reads the cache
  const { data: tokens } = useQuery({
    ...tokenAccountsQueryOptions({ cluster, solanaAddress, anchorProvider }),
    enabled: false,
  })

  const { currency: currencyRaw, locked } = useAppStorage()

  const currency = useMemo(() => currencyRaw?.toLowerCase(), [currencyRaw])

  const queryClient = useQueryClient()

  // Use anchorProvider.connection instead of anchorProvider to prevent unnecessary re-syncs
  // when the provider object reference changes but the connection hasn't
  const providerConnection = anchorProvider?.connection
  const syncTokens = useEffectEvent(() => {
    if (!currentAccount?.solanaAddress || !anchorProvider || locked) return
    syncTokenAccounts(queryClient, {
      cluster,
      acct: currentAccount,
      anchorProvider,
    }).catch(() => {
      // The sync guard skipped it or the RPC failed; the last balances stay
    })
  })
  useEffect(() => {
    syncTokens()
  }, [providerConnection, cluster, currentAccount, queryClient, locked])

  const tokenAccounts = useMemo(() => {
    if (!cluster || !anchorProvider || !anchorProvider.publicKey)
      return undefined

    return tokens?.atas || []
  }, [cluster, anchorProvider, tokens])

  const [oraclePrice, setOraclePrice] = useState<OraclePrice>()
  const [oraclePriceError, setOraclePriceError] = useState<Error>()
  const oracleRpcEndpoint = anchorProvider?.connection.rpcEndpoint
  // The app connection is wrapped by a persisted account cache, which can
  // serve a stale feed that getOraclePrice rejects (older than 10 minutes).
  const oracleConnection = useMemo(
    () =>
      oracleRpcEndpoint
        ? new Connection(oracleRpcEndpoint, 'confirmed')
        : undefined,
    [oracleRpcEndpoint],
  )

  const [prevOracleConnection, setPrevOracleConnection] =
    useState(oracleConnection)
  if (prevOracleConnection !== oracleConnection) {
    setPrevOracleConnection(oracleConnection)
    setOraclePrice(undefined)
    setOraclePriceError(undefined)
  }

  // Poll the HNT oracle price. Retry sooner after an error, and keep the
  // last good price only while it is fresh enough to mint DC with.
  useEffect(() => {
    if (!oracleConnection) return

    let cancelled = false
    let fetching = false
    let timeout: ReturnType<typeof setTimeout> | undefined
    let expiry: ReturnType<typeof setTimeout> | undefined

    const fetchOraclePrice = async () => {
      let delay = ORACLE_POLL_INTERVAL
      fetching = true
      try {
        const { priceMessage } = await withTimeout(
          getOraclePrice({
            tokenType: 'HNT',
            connection: oracleConnection,
          }),
          ORACLE_FETCH_TIMEOUT,
          'HNT price request timed out',
        )
        if (cancelled) return
        const price = new BN(
          (priceMessage.emaPrice.toNumber() -
            priceMessage.emaConf.toNumber() * 2) *
            10 ** priceMessage.exponent *
            100000,
        )
        const { publishTime } = priceMessage
        // Keep the same BN when the price is unchanged so consumers keyed on
        // it do not recompute on every poll.
        setOraclePrice((prev) => ({
          price: prev?.price.eq(price) ? prev.price : price,
          publishTime,
        }))
        setOraclePriceError(undefined)
        // Drop the price once it is too old, unless a newer one arrived.
        clearTimeout(expiry)
        expiry = setTimeout(
          () => {
            setOraclePrice((prev) =>
              prev && prev.publishTime > publishTime ? prev : undefined,
            )
            // Fetch now instead of waiting out the poll with no price.
            // An in-flight fetch already schedules the next poll.
            if (!fetching) {
              clearTimeout(timeout)
              timeout = setTimeout(() => void fetchOraclePrice(), 0)
            }
          },
          Math.max(0, publishTime * 1000 + ORACLE_MAX_AGE - Date.now()),
        )
      } catch (e) {
        if (cancelled) return
        delay = ORACLE_RETRY_INTERVAL
        setOraclePriceError(e as Error)
        setOraclePrice((prev) =>
          isOraclePriceFresh(prev, Date.now()) ? prev : undefined,
        )
      } finally {
        fetching = false
      }
      timeout = setTimeout(() => void fetchOraclePrice(), delay)
    }

    void fetchOraclePrice()

    return () => {
      cancelled = true
      clearTimeout(timeout)
      clearTimeout(expiry)
    }
  }, [oracleConnection])

  const hntToDcPrice = oraclePrice?.price

  const solanaPrice = useMemo(() => {
    if (!tokenPrices?.solana) return

    return tokenPrices.solana[currency]
  }, [currency, tokenPrices])

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

  const { language } = useLanguage()
  // Memoized: the effect below keys on its identity
  const tokenInfo = useMemo(() => {
    // No token data yet: fresh install, cleared cache, or new account
    if (!tokens?.atas) return undefined

    const atas = tokens.atas.filter(
      (ata) => !!ata.tokenAccount,
    ) as Required<TokenAccount>[]

    const solToken = tokens.sol

    const solBalance = solToken?.balance || 0
    const solPrice = tokenPrices?.solana?.[currency] || 0
    const solValue = solPrice * (solBalance / LAMPORTS_PER_SOL)
    const formattedSolValue = numberFormat(language, currency, solValue)

    const hntBalance = getBalance(HNT_MINT, atas)
    const hntPrice = tokenPrices?.helium?.[currency] || 0
    const hntValue = hntPrice * toNumber(hntBalance, 8)
    const formattedHntValue = numberFormat(language, currency, hntValue)

    const iotBalance = getBalance(IOT_MINT, atas)
    const iotPrice = tokenPrices?.['helium-iot']?.[currency] || 0
    const iotValue = iotPrice * toNumber(iotBalance, 6)
    const formattedIotValue = numberFormat(language, currency, iotValue)

    const mobileBalance = getBalance(MOBILE_MINT, atas)
    const mobilePrice = tokenPrices?.['helium-mobile']?.[currency] || 0
    const mobileValue = mobilePrice * toNumber(mobileBalance, 6)
    const formattedMobileValue = numberFormat(language, currency, mobileValue)

    const dcBalance = new BN(getBalance(DC_MINT, atas))
    const formattedDcValue = humanReadable(dcBalance, 5)

    const formattedTotal = numberFormat(
      language,
      currency,
      solValue + hntValue + mobileValue + iotValue,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tokens,
    cluster,
    currency,
    getBalance,
    hntToDcPrice,
    language,
    solanaAddress,
    tokenPrices,
  ])

  // tokenInfo is undefined until the token query has data. We store
  // the last value in `balanceInfo` and keep it while cluster and
  // solanaAddress stay the same. If cluster or solanaAddress change,
  // we reset `balanceInfo` to the new tokenInfo, which is the cached
  // value for the new account or undefined when there is none
  const rawSolAddress = currentAccount?.solanaAddress
  const [prevTokenInfo, setPrevTokenInfo] = useState(tokenInfo)
  const [prevCluster, setPrevCluster] = useState<typeof cluster>()
  const [prevSolAddress, setPrevSolAddress] = useState<string>()
  // A missing account never matches '' so it always clears, as before
  const shouldClear =
    prevSolAddress !== solanaAddress ||
    prevCluster !== cluster ||
    rawSolAddress === undefined
  if (shouldClear) {
    if (prevSolAddress !== solanaAddress) setPrevSolAddress(solanaAddress)
    if (prevCluster !== cluster) setPrevCluster(cluster)
    if (prevTokenInfo !== tokenInfo) setPrevTokenInfo(tokenInfo)
    if (balanceInfo !== tokenInfo) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setBalanceInfo(tokenInfo)
    }
  } else if (prevTokenInfo !== tokenInfo) {
    setPrevTokenInfo(tokenInfo)
    if (tokenInfo) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setBalanceInfo(tokenInfo)
    }
  }

  return {
    balanceHistory,
    dcToNetworkTokens,
    ...balanceInfo,
    networkTokensToDc,
    oraclePrice: hntToDcPrice,
    oraclePriceError,
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
  oraclePrice: undefined,
  oraclePriceError: undefined,
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

export const numberFormat = (
  language: string,
  currency: string,
  value: number,
) =>
  new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
  }).format(value)
