import { useCurrentWallet } from '@hooks/useCurrentWallet'
import {
  monitorOrder,
  MonitorOrderResult,
  SubmitIntentResponse,
} from '@dflow-protocol/swap-api-utils'
import { Transaction, Connection } from '@solana/web3.js'
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import * as Logger from '@utils/logger'

const AGGREGATOR_API_BASE_URL = 'https://quote-api.dflow.net'

interface IntentParams {
  userPublicKey?: string
  inputMint: string
  outputMint: string
  amount: string
  slippageBps?: number
  wrapAndUnwrapSol?: boolean
  feeBudget?: string
}

export interface Intent {
  inputMint: string
  inAmount: string
  outputMint: string
  outAmount: string
  otherAmountThreshold: string
  slippageBps: number
  platformFee: { amount: string; feeBps: number; feeAccount: string } | null
  feeBudget: number
  priceImpactPct: string
  openTransaction?: string
  lastValidBlockHeight?: number
  expiry?: { slotsAfterOpen: number }
  requestUrl: string
  requestParams: IntentParams
}

interface IDFlowContextState {
  loading: boolean
  error: unknown
  intent?: Intent

  getQuote: (opts: {
    inputMint: string
    outputMint: string
    amount: string
    slippageBps: number
  }) => Promise<Intent | undefined>

  signIntent: (intentData: Intent) => Promise<Transaction>

  submitIntent: (opts: {
    quoteResponse: Intent
    signedOpenTransaction: Transaction
  }) => Promise<SubmitIntentResponse | undefined>

  monitorOrder: (params: {
    connection: Connection
    intent: Intent
    signedOpenTransaction: Transaction
    submitIntentResponse: SubmitIntentResponse
  }) => Promise<MonitorOrderResult>
}

const DFlowContext = createContext<IDFlowContextState | null>(null)

export const DFlowProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const wallet = useCurrentWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>()
  const [intent, setIntent] = useState<Intent>()

  const getQuote = useCallback(
    async (opts: {
      inputMint: string
      outputMint: string
      amount: string
      slippageBps: number
    }) => {
      let foundIntent: Intent | undefined

      try {
        setLoading(true)

        const queryParams = new URLSearchParams()
        queryParams.append('inputMint', opts.inputMint)
        queryParams.append('outputMint', opts.outputMint)
        queryParams.append('amount', opts.amount)

        if (wallet) {
          queryParams.append('userPublicKey', wallet.toBase58())
        }

        queryParams.append('slippageBps', opts.slippageBps.toString())

        const response = await fetch(
          `${AGGREGATOR_API_BASE_URL}/intent?${queryParams.toString()}`,
        )

        if (!response.ok) {
          throw new Error(`Failed to get quote: ${response.statusText}`)
        }

        foundIntent = await response.json()
        setIntent(foundIntent)
      } catch (err: unknown) {
        Logger.error(err)
        setError(err)
      } finally {
        setLoading(false)
      }

      return foundIntent
    },
    [wallet],
  )

  const signIntent = useCallback(
    async (intentData: Intent): Promise<Transaction> => {
      if (!intentData.openTransaction) {
        throw new Error('No open transaction found in intent data')
      }

      const transactionBytes = Buffer.from(intentData.openTransaction, 'base64')
      const openTransaction = Transaction.from(transactionBytes)

      return openTransaction
    },
    [],
  )

  const submitIntent = useCallback(
    async (opts: {
      quoteResponse: Intent
      signedOpenTransaction: Transaction
    }): Promise<SubmitIntentResponse | undefined> => {
      try {
        const response = await fetch(
          `${AGGREGATOR_API_BASE_URL}/submit-intent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quoteResponse: opts.quoteResponse,
              signedOpenTransaction: Buffer.from(
                opts.signedOpenTransaction.serialize(),
              ).toString('base64'),
            }),
          },
        )

        if (!response.ok) {
          throw new Error(`Failed to submit intent: ${response.statusText}`)
        }

        return await response.json()
      } catch (err: unknown) {
        Logger.error(err)
        setError(err)
      }
    },
    [],
  )

  const value = useMemo(
    () => ({
      loading,
      error,
      intent,
      getQuote,
      signIntent,
      submitIntent,
      monitorOrder,
    }),
    [loading, error, intent, getQuote, signIntent, submitIntent],
  )

  return <DFlowContext.Provider value={value}>{children}</DFlowContext.Provider>
}

export const useDFlow = () => {
  const context = useContext(DFlowContext)
  if (!context) {
    throw new Error('useDFlow must be used within a DFlowProvider')
  }
  return context
}
