import { Configuration, DefaultApi } from '@jup-ag/api'
import { TokenInfo, TokenListProvider } from '@solana/spl-token-registry'
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useSolana } from 'src/solana/SolanaProvider'

type RouteMap = Map<string, string[]>
interface IJupiterContextState {
  api: DefaultApi
  loaded: boolean
  tokenMap: Map<string, TokenInfo>
  routeMap: RouteMap
}

const JupiterContext = createContext<IJupiterContextState | null>(null)
export const JupiterProvider: React.FC = ({ children }) => {
  const { cluster } = useSolana()
  const [tokenMap, setTokenMap] = useState<Map<string, TokenInfo>>(new Map())
  const [routeMap, setRouteMap] = useState<RouteMap>(new Map())
  const [loaded, setLoaded] = useState(false)
  const api = useMemo(() => {
    const config = new Configuration({
      basePath: 'https://quote-api.jup.ag/v6',
    })
    return new DefaultApi(config)
  }, [])

  useEffect(() => {
    ;(async () => {
      const [tokens, indexedRouteMapResult] = await Promise.all([
        new TokenListProvider().resolve(),
        api.indexedRouteMapGet(),
      ])

      const tokenList = tokens.filterByClusterSlug(cluster).getList()
      const { indexedRouteMap = {}, mintKeys = [] } = indexedRouteMapResult

      setTokenMap(
        tokenList.reduce((map, item) => {
          map.set(item.address, item)
          return map
        }, new Map()),
      )

      setRouteMap(
        Object.keys(indexedRouteMap).reduce((map, key) => {
          map.set(
            mintKeys[Number(key)],
            indexedRouteMap[key].map((index) => mintKeys[index]),
          )
          return map
        }, new Map<string, string[]>()),
      )

      setLoaded(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /*   const getQuote = useCallback(
    () =>
      api.quoteGet({
        inputMint: '',
        outputMint: '',
        amount: 100000,
        slippageBps: 20,
        platformFeeBps: 20,
      }),
    [api],
  ) */

  /* const swap = useCallback(() => {
    api.swapPost({

    })
  }, [api]) */

  return (
    <JupiterContext.Provider
      value={{
        api,
        routeMap,
        tokenMap,
        loaded,
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
