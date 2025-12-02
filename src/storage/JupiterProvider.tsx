/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { VersionedTransaction } from '@solana/web3.js'
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import Config from 'react-native-config'
import * as Logger from '../utils/logger'

type QuoteGetRequest = {
  inputMint: string
  outputMint: string
  amount: number
  slippageBps?: number
  platformFeeBps?: number
}

type QuoteResponse = {
  outAmount?: string | number
  priceImpactPct?: string | number
  // Allow additional fields from the backend without strict typing
  [key: string]: any
}

type SwapPostRequest = {
  swapRequest?: {
    quoteResponse?: QuoteResponse
    userPublicKey?: string
    feeAccount?: string
    // Allow additional passthrough fields
    [key: string]: any
  }
}

interface IJupiterContextState {
  loading: boolean
  error: unknown
  routes?: QuoteResponse

  getRoute: (opts: QuoteGetRequest) => Promise<QuoteResponse | undefined>
  getSwapTx: (
    opts?: Pick<SwapPostRequest, 'swapRequest'>,
    routesIn?: QuoteResponse,
  ) => Promise<VersionedTransaction | undefined>
}

const JupiterContext = createContext<IJupiterContextState | null>(null)
export const JupiterProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>()
  const [routes, setRoutes] = useState<QuoteResponse>()

  const baseUrl = useMemo(() => {
    // Prefer explicit Helium API base if provided; fallback to public hosted API
    return (
      Config.HELIUM_TRANSACTION_API ||
      process.env.HELIUM_TRANSACTION_API ||
      'https://my-helium.web.helium.io/api/v1'
    )
  }, [])

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    }
    const apiKey = Config.HELIUM_API_KEY
    if (apiKey) {
      headers['x-helium-api-key'] = apiKey
    }
    return headers
  }, [])

  const getRoute = useCallback(
    async (opts: QuoteGetRequest) => {
      let foundRoutes: undefined | QuoteResponse

      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('inputMint', opts.inputMint)
        params.set('outputMint', opts.outputMint)
        params.set('amount', String(opts.amount))
        if (typeof opts.slippageBps === 'number')
          params.set('slippageBps', String(opts.slippageBps))
        const platformFeeBps =
          typeof opts.platformFeeBps === 'number'
            ? opts.platformFeeBps
            : Number(Config.JUPITER_FEE_BPS) || 0
        if (platformFeeBps) params.set('platformFeeBps', String(platformFeeBps))

        // Helium Swap API: proxy to Jupiter behind the scenes
        // Endpoint shape aligns with quote semantics
        const res = await fetch(`${baseUrl}/swap/quote?${params.toString()}`, {
          method: 'GET',
          headers: authHeaders,
        })
        if (!res.ok) {
          throw new Error(`Quote request failed: ${res.status}`)
        }
        foundRoutes = (await res.json()) as QuoteResponse

        setRoutes(foundRoutes)
      } catch (err: any) {
        Logger.error(err)
        setError(err.toString())
      } finally {
        setLoading(false)
      }

      return foundRoutes
    },
    [authHeaders, baseUrl],
  )

  const getSwapTx = useCallback(
    async (
      opts?: Pick<SwapPostRequest, 'swapRequest'>,
      routesIn?: QuoteResponse,
    ) => {
      try {
        if (!routes && !routesIn) throw new Error(t('errors.swap.routes'))
        if (!wallet) throw new Error(t('errors.account'))

        const chosenQuote = routesIn || routes
        if (!chosenQuote) throw new Error(t('errors.swap.routes'))

        const body = {
          quoteResponse: chosenQuote,
          userPublicKey: wallet.toBase58(),
          feeAccount: Config.JUPITER_FEE_ACCOUNT || undefined,
          ...(opts?.swapRequest || {}),
        }

        // Helium Swap API: returns a base64 transaction similar to Jupiter
        const res = await fetch(`${baseUrl}/swap/instructions`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ ...body }),
        })
        if (!res.ok) {
          throw new Error(`Swap request failed: ${res.status}`)
        }
        const json = (await res.json()) as {
          transactions: { serializedTransaction: string }[]
        }
        if (!json.transactions.length) throw new Error(t('errors.swap.tx'))

        return json.transactions.map((transaction) =>
          VersionedTransaction.deserialize(
            Buffer.from(transaction.serializedTransaction, 'base64'),
          ),
        )[0]
      } catch (err: any) {
        Logger.error(err)
        setError(err.toString())
      }
    },
    [t, routes, wallet, baseUrl, authHeaders],
  )

  return (
    <JupiterContext.Provider
      value={{
        loading,
        error,
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
