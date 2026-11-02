/**
 * Runs the real useGovernanceSubmit submit. The wallet signs a real
 * transaction with a test key; the sign sheet and the blockchain API client
 * are replaced.
 */
import { ORPCError } from '@orpc/client'
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { UnconfirmedSubmitError } from '../../utils/unconfirmedSubmitError'
import { useGovernanceSubmit } from '../useGovernanceSubmit'

const sender = Keypair.generate()

const mockWallet = {
  signAllTransactions: async <T,>(txs: T[]) => {
    txs.forEach((tx) => (tx as VersionedTransaction).sign([sender]))
    return txs
  },
}
const mockSignSheet = { show: async () => true }
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
jest.mock('../../solana/MessagePreview', () => ({}))
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({ anchorProvider: { wallet: mockWallet } }),
}))
jest.mock('../../solana/WalletSignProvider', () => ({
  useWalletSign: () => ({ walletSignBottomSheetRef: mockSignSheet }),
}))
jest.mock('../../storage/BlockchainApiProvider', () => ({
  useBlockchainApi: () => mockClient,
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

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
})

let hook: ReturnType<typeof useGovernanceSubmit>
let renderer: TestRenderer.ReactTestRenderer

const Harness = () => {
  // eslint-disable-next-line react-hooks/globals -- the test harness hands the hook result to the test
  hook = useGovernanceSubmit()
  return null
}

describe('useGovernanceSubmit', () => {
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
        hook.submit(
          { transactionData: transactionData() },
          { header: 'Delegate', message: 'Delegate position' },
        ),
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
        hook.submit(
          { transactionData: transactionData() },
          { header: 'Delegate', message: 'Delegate position' },
        ),
      ).rejects.toBe(rejection)
    })
    expect(mockClient.transactions.get).not.toHaveBeenCalled()
  })

  it('reports a batch status request that failed as unconfirmed', async () => {
    const lost = new TypeError('Network request failed')
    mockClient.transactions.submit.mockResolvedValue({ batchId: 'batch' })
    mockClient.transactions.get.mockRejectedValue(lost)

    let error: unknown
    await act(async () => {
      error = await hook
        .submit(
          { transactionData: transactionData() },
          { header: 'Delegate', message: 'Delegate position' },
        )
        .catch((e: unknown) => e)
    })
    expect(error).toBeInstanceOf(UnconfirmedSubmitError)
    expect((error as UnconfirmedSubmitError).cause).toBe(lost)
    expect(mockClient.transactions.get).toHaveBeenCalledTimes(1)
  })
})
