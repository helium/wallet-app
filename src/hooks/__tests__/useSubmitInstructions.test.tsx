/**
 * Runs the real useSubmitInstructions mutation. The wallet signs real
 * transactions with a test key; the transaction builder, the sign sheet, the
 * connection and the blockchain API client are replaced.
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
import { useSubmitInstructions } from '../useSubmitInstructions'

const sender = Keypair.generate()

const mockWallet = {
  signAllTransactions: async <T,>(txs: T[]) => {
    txs.forEach((tx) => (tx as VersionedTransaction).sign([sender]))
    return txs
  },
}
const mockConnection = {
  getLatestBlockhash: async () => ({
    blockhash: PublicKey.default.toBase58(),
  }),
}
const mockSignSheet = { show: async () => true }
const mockClient = {
  transactions: { submit: jest.fn(), get: jest.fn() },
}
// How many transactions the instructions batch into.
let mockDraftCount = 1

// Every draft becomes one unsigned transfer.
jest.mock('@helium/spl-utils', () => ({
  batchInstructionsToTxsWithPriorityFee: async () =>
    Array.from({ length: mockDraftCount }, () => ({})),
  chunks: <T,>(items: T[], size: number) =>
    Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
      items.slice(i * size, (i + 1) * size),
    ),
  populateMissingDraftInfo: async (_connection: unknown, draft: unknown) =>
    draft,
  toVersionedTx: () => mockUnsignedTransaction(),
}))
// @orpc/client ships ESM only. ORPCError mirrors the real one.
jest.mock('@orpc/client', () => ({
  ORPCError: class MockORPCError extends Error {},
}))
jest.mock('../../solana/MessagePreview', () => ({}))
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({
    anchorProvider: { wallet: mockWallet, connection: mockConnection },
    cluster: 'mainnet-beta',
  }),
}))
jest.mock('../../solana/WalletSignProvider', () => ({
  useWalletSign: () => ({ walletSignBottomSheetRef: mockSignSheet }),
}))
jest.mock('../../storage/BlockchainApiProvider', () => ({
  useBlockchainApi: () => mockClient,
}))
jest.mock('../../utils/constants', () => ({
  MAX_TRANSACTIONS_PER_SIGNATURE_BATCH: 5,
}))
jest.mock('../../utils/walletApiV2', () => ({
  getBasePriorityFee: async () => 1,
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true
// Deliver mutation updates at once, so no test waits on a timer.
notifyManager.setScheduler((callback) => callback())

const mockUnsignedTransaction = () =>
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
  )

const params = () => ({
  header: 'Close position',
  message: 'Close position',
  instructions: [],
})

let hook: ReturnType<typeof useSubmitInstructions>
let renderer: TestRenderer.ReactTestRenderer

const Harness = () => {
  // eslint-disable-next-line react-hooks/globals -- the test harness hands the hook result to the test
  hook = useSubmitInstructions()
  return null
}

describe('useSubmitInstructions', () => {
  beforeEach(() => {
    mockClient.transactions.submit.mockReset()
    mockClient.transactions.get.mockReset()
    mockClient.transactions.submit.mockRejectedValue(
      new TypeError('Network request failed'),
    )
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
    mockDraftCount = 1

    await act(async () => {
      await expect(hook.execute(params())).rejects.toBeInstanceOf(
        UnconfirmedSubmitError,
      )
    })
    expect(mockClient.transactions.submit).toHaveBeenCalledTimes(1)
    expect(mockClient.transactions.get).not.toHaveBeenCalled()
  })

  it('reports a chunk submit that got no answer as unconfirmed', async () => {
    mockDraftCount = 6

    await act(async () => {
      await expect(hook.execute(params())).rejects.toBeInstanceOf(
        UnconfirmedSubmitError,
      )
    })
    expect(mockClient.transactions.submit).toHaveBeenCalledTimes(1)
    expect(
      mockClient.transactions.submit.mock.calls[0][0].transactions,
    ).toHaveLength(5)
    expect(mockClient.transactions.get).not.toHaveBeenCalled()
  })
})
