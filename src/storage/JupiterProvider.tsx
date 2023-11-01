/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import {
  Configuration,
  DefaultApi,
  QuoteGetRequest,
  QuoteResponse,
  SwapPostRequest,
} from '@jup-ag/api'
import { VersionedTransaction } from '@solana/web3.js'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import Config from 'react-native-config'
import * as Logger from '../utils/logger'

type RouteMap = Map<string, string[]>
interface IJupiterContextState {
  loading: boolean
  error: unknown
  api: DefaultApi
  routeMap: RouteMap
  routes?: QuoteResponse

  getRoute: (opts: QuoteGetRequest) => Promise<QuoteResponse | undefined>
  getSwapTx: (
    opts?: Pick<SwapPostRequest, 'swapRequest'>,
  ) => Promise<VersionedTransaction | undefined>
}

const JupiterContext = createContext<IJupiterContextState | null>(null)
export const JupiterProvider: React.FC = ({ children }) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const [routeMap, setRouteMap] = useState<RouteMap>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>()
  const [routes, setRoutes] = useState<QuoteResponse>()

  const api = useMemo(() => {
    const config = new Configuration({
      basePath: 'https://quote-api.jup.ag/v6',
    })
    return new DefaultApi(config)
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const indexedRouteMapResult = await api.indexedRouteMapGet()
      const { indexedRouteMap = {}, mintKeys = [] } = indexedRouteMapResult

      setRouteMap(
        Object.keys(indexedRouteMap).reduce((map, key) => {
          map.set(
            mintKeys[Number(key)],
            indexedRouteMap[key].map((index) => mintKeys[index]),
          )
          return map
        }, new Map<string, string[]>()),
      )

      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getRoute = useCallback(
    async (opts: QuoteGetRequest) => {
      let foundRoutes: undefined | QuoteResponse

      try {
        setLoading(true)
        foundRoutes = await api.quoteGet({
          ...opts,
          platformFeeBps: Number(Config.JUPITER_FEE_BPS) || 0,
        })
        setRoutes(foundRoutes)
      } catch (err: any) {
        Logger.error(err)
        setError(err.toString())
      } finally {
        setLoading(false)
      }

      return foundRoutes
    },
    [api],
  )

  const getSwapTx = useCallback(
    async (opts?: Pick<SwapPostRequest, 'swapRequest'>) => {
      try {
        if (!routes) throw new Error(t('errors.swap.routes'))
        if (!wallet) throw new Error(t('errors.account'))

        const { swapTransaction } = await api.swapPost({
          swapRequest: {
            quoteResponse: routes,
            userPublicKey: wallet.toBase58(),
            feeAccount: Config.JUPITER_FEE_ACCOUNT || undefined,
            ...opts,
          },
        })

        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
        return VersionedTransaction.deserialize(swapTransactionBuf)
      } catch (err: any) {
        Logger.error(err)
        setError(err.toString())
      }
    },
    [t, api, routes, wallet],
  )

  return (
    <JupiterContext.Provider
      value={{
        loading,
        error,
        api,
        routeMap,
        routes,

        getRoute,
        getSwapTx,
      }}
    >
      {children}
    </JupiterContext.Provider>
  )
}

export const useJupiter = () => {
  const context = useContext(JupiterContext)

  if (!context) {
    throw new Error('useJupiter must be used within a JupiterProvider')
  }

  return context
}
