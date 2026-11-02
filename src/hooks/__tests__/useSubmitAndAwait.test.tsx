/**
 * Runs the real useSubmitAndAwait mutation. The wallet signs a real
 * transaction with a test key; the blockchain API client is replaced.
 */
import { ORPCError } from '@orpc/client'
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { UnconfirmedSubmitError } from '../../utils/unconfirmedSubmitError'
import { useSubmitAndAwait } from '../useSubmitAndAwait'

const sender = Keypair.generate()

const mockWallet = {
  signAllTransactions: async <T,>(txs: T[]) => {
    txs.forEach((tx) => (tx as VersionedTransaction).sign([sender]))
    return txs
  },
}
const mockClient = {
  transactions: { submit: jest.fn(), get: jest.fn() },
}

// @orpc/client ships ESM only. ORPCError mirrors the real one's code and
// defined fields.
jest.mock('@orpc/client', () => {
  class MockORPCError extends Error {
    code: string

    defined: boolean

    constructor(
      code: string,
      options: { defined?: boolean; message?: string } = {},
    ) {
      super(options.message ?? code)
      this.code = code
      this.defined = options.defined ?? false
    }
  }
  return { ORPCError: MockORPCError }
})
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({ anchorProvider: { wallet: mockWallet } }),
}))
jest.mock('../../storage/BlockchainApiProvider', () => ({
  useBlockchainApi: () => mockClient,
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true
// Deliver mutation updates at once, so no test waits on a timer.
notifyManager.setScheduler((callback) => callback())

// What the API builds: one unsigned transfer, base64 encoded.
const transactionData = () => ({
  transactions: [
    {
      serializedTransaction: Buffer.from(
        new VersionedTransaction(
          new TransactionMessage({
            payerKey: sender.publicKey,
            recentBlockhash: PublicKey.default.toBase58(),
            instructions: [
              SystemProgram.transfer({
                fromPubkey: sender.publicKey,
                toPubkey: Keypair.generate().publicKey,
                lamports: 1,
              }),
            ],
          }).compileToV0Message(),
        ).serialize(),
      ).toString('base64'),
    },
  ],
  parallel: false,
  tag: 'onboard',
})

let hook: ReturnType<typeof useSubmitAndAwait>
let renderer: TestRenderer.ReactTestRenderer

const Harness = () => {
  // eslint-disable-next-line react-hooks/globals -- the test harness hands the hook result to the test
  hook = useSubmitAndAwait()
  return null
}

describe('useSubmitAndAwait', () => {
  beforeEach(() => {
    mockClient.transactions.submit.mockReset()
    mockClient.transactions.get.mockReset()
    act(() => {
      renderer = TestRenderer.create(
        <QueryClientProvider client={new QueryClient()}>
          <Harness />
        </QueryClientProvider>,
      )
    })
  })
  afterEach(() => act(() => renderer.unmount()))

  it('reports a submit that got no answer as unconfirmed', async () => {
    mockClient.transactions.submit.mockRejectedValue(
      new TypeError('Network request failed'),
    )

    await act(async () => {
      await expect(
        hook.submitAndAwait({ transactionData: transactionData() }),
      ).rejects.toBeInstanceOf(UnconfirmedSubmitError)
    })
    expect(mockClient.transactions.submit).toHaveBeenCalledTimes(1)
    expect(mockClient.transactions.get).not.toHaveBeenCalled()
  })

  it('keeps a rejection that proves nothing was sent', async () => {
    const rejection = new ORPCError('SIMULATION_FAILED', {
      defined: true,
      message: 'Simulation failed: insufficient funds',
    })
    mockClient.transactions.submit.mockRejectedValue(rejection)

    await act(async () => {
      await expect(
        hook.submitAndAwait({ transactionData: transactionData() }),
      ).rejects.toBe(rejection)
    })
    expect(mockClient.transactions.get).not.toHaveBeenCalled()
  })

  it('reports a batch still pending past the max poll time as unconfirmed', async () => {
    jest.useFakeTimers()
    try {
      mockClient.transactions.submit.mockResolvedValue({ batchId: 'batch' })
      mockClient.transactions.get.mockResolvedValue({ status: 'pending' })

      let error: unknown
      await act(async () => {
        const outcome = hook
          .submitAndAwait({ transactionData: transactionData() })
          .catch((e: unknown) => e)
        // The poll asks every 2 s and gives up after 60 s.
        await jest.advanceTimersByTimeAsync(60_000)
        error = await outcome
      })
      expect(error).toBeInstanceOf(UnconfirmedSubmitError)
      expect(mockClient.transactions.get).toHaveBeenCalledTimes(30)
    } finally {
      jest.useRealTimers()
    }
  })

  it('reports a batch status request that failed as unconfirmed', async () => {
    const lost = new TypeError('Network request failed')
    mockClient.transactions.submit.mockResolvedValue({ batchId: 'batch' })
    mockClient.transactions.get.mockRejectedValue(lost)

    let error: unknown
    await act(async () => {
      error = await hook
        .submitAndAwait({ transactionData: transactionData() })
        .catch((e: unknown) => e)
    })
    expect(error).toBeInstanceOf(UnconfirmedSubmitError)
    expect((error as UnconfirmedSubmitError).cause).toBe(lost)
    expect(mockClient.transactions.get).toHaveBeenCalledTimes(1)
  })
})
