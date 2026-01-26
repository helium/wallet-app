import type { QuoteResponse, TransactionData } from '@helium/blockchain-api'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { VersionedTransaction } from '@solana/web3.js'
import { useMutation } from '@tanstack/react-query'
import React, { createContext, useCallback, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlockchainApi } from './BlockchainApiProvider'

type QuoteGetRequest = {
  inputMint: string
  outputMint: string
  amount: number
  slippageBps?: number
  platformFeeBps?: number
}

interface IJupiterContextState {
  loading: boolean
  error: unknown
  routes?: QuoteResponse

  getRoute: (opts: QuoteGetRequest) => Promise<QuoteResponse | undefined>
  getSwapTx: (
    routesIn?: QuoteResponse,
  ) => Promise<VersionedTransaction | undefined>
  getSwapTransactionData: (routesIn?: QuoteResponse) => Promise<TransactionData>
}

const JupiterContext = createContext<IJupiterContextState | null>(null)

export const JupiterProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const client = useBlockchainApi()

  // Quote mutation using oRPC client
  const {
    mutateAsync: fetchQuote,
    isPending,
    error,
    data: routes,
  } = useMutation({
    mutationFn: async (opts: QuoteGetRequest) => {
      return client.swap.getQuote({
        inputMint: opts.inputMint,
        outputMint: opts.outputMint,
        amount: String(opts.amount),
        slippageBps: opts.slippageBps ?? 50,
      })
    },
  })

  // Get swap transaction data using oRPC client
  const getSwapTransactionData = useCallback(
    async (routesIn?: QuoteResponse): Promise<TransactionData> => {
      const chosenQuote = routesIn || routes
      if (!chosenQuote) throw new Error(t('errors.swap.routes'))
      if (!wallet) throw new Error(t('errors.account'))

      return client.swap.getInstructions({
        quoteResponse: chosenQuote,
        userPublicKey: wallet.toBase58(),
      })
    },
    [routes, wallet, client, t],
  )

  // Get swap transaction (returns first VersionedTransaction for backwards compatibility)
  const getSwapTx = useCallback(
    async (
      routesIn?: QuoteResponse,
    ): Promise<VersionedTransaction | undefined> => {
      const txnData = await getSwapTransactionData(routesIn)

      if (!txnData.transactions.length) throw new Error(t('errors.swap.tx'))

      return VersionedTransaction.deserialize(
        Buffer.from(txnData.transactions[0].serializedTransaction, 'base64'),
      )
    },
    [getSwapTransactionData, t],
  )

  const getRoute = useCallback(
    async (opts: QuoteGetRequest): Promise<QuoteResponse | undefined> => {
      return fetchQuote(opts)
    },
    [fetchQuote],
  )

  const value = useMemo(
    () => ({
      loading: isPending,
      error,
      routes,
      getRoute,
      getSwapTx,
      getSwapTransactionData,
    }),
    [isPending, error, routes, getRoute, getSwapTx, getSwapTransactionData],
  )

  return (
    <JupiterContext.Provider value={value}>{children}</JupiterContext.Provider>
  )
}

export const useJupiter = () => {
  const context = useContext(JupiterContext)

  if (!context) {
    throw new Error('useJupiter must be used within a JupiterProvider')
  }

  return context
}
