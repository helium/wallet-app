/**
 * Runs the real useSubmitTransaction mutation. The wallet signs a real
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
import { useSubmitTransaction } from '../useSubmitTransaction'

const sender = Keypair.generate()

const mockWallet = {
  signAllTransactions: async <T,>(txs: T[]) => {
    txs.forEach((tx) => (tx as VersionedTransaction).sign([sender]))
    return txs
  },
}
const mockClient = {
  transactions: { submit: jest.fn() },
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

let hook: ReturnType<typeof useSubmitTransaction>
let renderer: TestRenderer.ReactTestRenderer

const Harness = () => {
  // eslint-disable-next-line react-hooks/globals -- the test harness hands the hook result to the test
  hook = useSubmitTransaction()
  return null
}

describe('useSubmitTransaction', () => {
  beforeEach(() => {
    mockClient.transactions.submit.mockReset()
    act(() => {
      renderer = TestRenderer.create(
        <QueryClientProvider client={new QueryClient()}>
          <Harness />
        </QueryClientProvider>,
      )
    })
  })
  afterEach(() => act(() => renderer.unmount()))

  it('reports a submit the server may have sent as unconfirmed', async () => {
    // The server reports a failed or lost send as BAD_REQUEST.
    mockClient.transactions.submit.mockRejectedValue(
      new ORPCError('BAD_REQUEST', { defined: true }),
    )

    await act(async () => {
      await expect(
        hook.submit({ transactionData: transactionData() }),
      ).rejects.toBeInstanceOf(UnconfirmedSubmitError)
    })
    expect(mockClient.transactions.submit).toHaveBeenCalledTimes(1)
  })
})
