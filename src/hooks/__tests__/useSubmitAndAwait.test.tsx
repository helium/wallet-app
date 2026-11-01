/**
 * Runs the real useSubmitAndAwait mutation. The wallet signs a real
 * transaction with a test key; the blockchain API client is replaced.
 */
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

// @orpc/client ships ESM only. ORPCError mirrors the real one.
jest.mock('@orpc/client', () => ({
  ORPCError: class MockORPCError extends Error {},
}))
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
})
