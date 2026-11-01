/**
 * Runs the real payment and delegate mutations of useSubmitTxn. The wallet
 * signs real transactions with a test key; the sign sheet and the blockchain
 * API client are replaced.
 */
import { ORPCError } from '@orpc/client'
import { NATIVE_MINT } from '@solana/spl-token'
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
import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { UnconfirmedSubmitError } from '../../utils/unconfirmedSubmitError'
import useSubmitTxn from '../useSubmitTxn'

const sender = Keypair.generate()
const alice = Keypair.generate().publicKey

const mockWallet = {
  signAllTransactions: async <T,>(txs: T[]) => {
    txs.forEach((tx) => (tx as VersionedTransaction).sign([sender]))
    return txs
  },
}
const mockSignSheet = { show: jest.fn() }
const mockClient = {
  tokens: { multiTransfer: jest.fn() },
  dataCredits: { delegate: jest.fn() },
  transactions: { submit: jest.fn() },
}

jest.mock('@helium/helium-entity-manager-sdk', () => ({}))
jest.mock('@helium/onboarding', () => ({}))
jest.mock('@helium/react-native-sdk', () => ({
  useOnboarding: () => ({ getAssertData: jest.fn() }),
}))
jest.mock('@helium/spl-utils', () => ({
  DC_MINT: jest.requireActual('@solana/web3.js').PublicKey.default,
}))
// @orpc/client ships ESM only. ORPCError and isDefinedError mirror the real
// ones; safe() settles the call into { error, data }.
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
  return {
    ORPCError: MockORPCError,
    isDefinedError: (error: unknown) =>
      error instanceof MockORPCError && error.defined,
    safe: (call: Promise<unknown>) =>
      call.then(
        (data) => ({ error: null, data }),
        (error) => ({ error, data: undefined }),
      ),
  }
})
jest.mock(
  '@storage/AccountStorageProvider',
  () => ({
    useAccountStorage: () => ({
      currentAccount: {
        solanaAddress: jest
          .requireActual('@solana/web3.js')
          .Keypair.generate()
          .publicKey.toBase58(),
      },
    }),
  }),
  { virtual: true },
)
jest.mock('@utils/WrappedConnection', () => ({}), { virtual: true })
jest.mock('@utils/accountUtils', () => ({}), { virtual: true })
jest.mock('@utils/constants', () => ({ Mints: {} }), { virtual: true })
jest.mock('@utils/formatting', () => ({}), { virtual: true })
jest.mock('@utils/i18n', () => ({ t: (key: string) => key }), {
  virtual: true,
})
jest.mock('@utils/solanaUtils', () => ({}), { virtual: true })
jest.mock('../../solana/CollectablePreview', () => ({}))
jest.mock('../../solana/MessagePreview', () => ({}))
jest.mock('../../solana/PaymentPreview', () => ({}))
jest.mock('../../solana/SwapPreview', () => ({}))
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({ anchorProvider: { wallet: mockWallet } }),
}))
jest.mock('../../solana/WalletSignProvider', () => ({
  useWalletSign: () => ({ walletSignBottomSheetRef: mockSignSheet }),
}))
jest.mock('../../storage/BlockchainApiProvider', () => ({
  useBlockchainApi: () => mockClient,
}))
jest.mock('../useSubmitAndAwait', () => ({ pollForCompletion: jest.fn() }))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true
// Deliver mutation updates at once, so no test waits on a timer.
notifyManager.setScheduler((callback) => callback())

// What the API builds: one unsigned transfer, base64 encoded.
const unsignedTransfer = () =>
  Buffer.from(
    new VersionedTransaction(
      new TransactionMessage({
        payerKey: sender.publicKey,
        recentBlockhash: PublicKey.default.toBase58(),
        instructions: [
          SystemProgram.transfer({
            fromPubkey: sender.publicKey,
            toPubkey: alice,
            lamports: 1,
          }),
        ],
      }).compileToV0Message(),
    ).serialize(),
  ).toString('base64')

const transactionData = () => ({
  transactions: [{ serializedTransaction: unsignedTransfer() }],
  parallel: false,
  tag: 'payment',
})

let hook: ReturnType<typeof useSubmitTxn>
let renderer: TestRenderer.ReactTestRenderer

const Harness = () => {
  // eslint-disable-next-line react-hooks/globals -- the test harness hands the hook result to the test
  hook = useSubmitTxn()
  return null
}

const render = () => {
  const queryClient = new QueryClient()
  act(() => {
    renderer = TestRenderer.create(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    )
  })
}

const pay = () =>
  hook.paymentMutation.mutateAsync({
    payments: [{ payee: alice.toBase58(), balanceAmount: new BN(1) }],
    mint: NATIVE_MINT,
  })

const delegate = () =>
  hook.delegateDataCreditsMutation.mutateAsync({
    delegateAddress: 'routerKey',
    amount: 1,
    mint: NATIVE_MINT,
  })

describe('useSubmitTxn', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    mockSignSheet.show.mockReset().mockResolvedValue(true)
    mockClient.tokens.multiTransfer
      .mockReset()
      .mockResolvedValue({ transactionData: transactionData() })
    mockClient.dataCredits.delegate
      .mockReset()
      .mockResolvedValue(transactionData())
    mockClient.transactions.submit.mockReset()
    render()
  })
  afterEach(() => act(() => renderer.unmount()))

  it('reads the signed payment transactions before it submits them', async () => {
    const deserialize = jest.spyOn(VersionedTransaction, 'deserialize')
    mockClient.transactions.submit.mockResolvedValue({ batchId: 'batch' })

    let sent: Awaited<ReturnType<typeof pay>> | undefined
    await act(async () => {
      sent = await pay()
    })

    const [{ transactions: submitted }] =
      mockClient.transactions.submit.mock.calls[0]
    const signedBytes = Buffer.from(
      submitted[0].serializedTransaction,
      'base64',
    )
    // The first read of the signed bytes comes before the submit.
    const signedRead = deserialize.mock.calls.findIndex(([bytes]) =>
      Buffer.from(bytes).equals(signedBytes),
    )
    expect(signedRead).toBeGreaterThanOrEqual(0)
    expect(deserialize.mock.invocationCallOrder[signedRead]).toBeLessThan(
      mockClient.transactions.submit.mock.invocationCallOrder[0],
    )
    expect(sent?.batchId).toBe('batch')
    expect(sent?.transactions.map((tx) => Buffer.from(tx.serialize()))).toEqual(
      [signedBytes],
    )
  })

  it('reports a payment submit that got no answer as unconfirmed', async () => {
    mockClient.transactions.submit.mockRejectedValue(
      new TypeError('Network request failed'),
    )

    await act(async () => {
      await expect(pay()).rejects.toBeInstanceOf(UnconfirmedSubmitError)
    })
  })

  it('reports a payment the user declined as a plain error', async () => {
    mockSignSheet.show.mockResolvedValue(false)

    await act(async () => {
      const error = await pay().catch((e: unknown) => e)
      expect(error).toBeInstanceOf(Error)
      expect(error).not.toBeInstanceOf(UnconfirmedSubmitError)
    })
    expect(mockClient.transactions.submit).not.toHaveBeenCalled()
  })

  it('reports a delegate submit that got no answer as unconfirmed', async () => {
    mockClient.transactions.submit.mockRejectedValue(
      new TypeError('Network request failed'),
    )

    await act(async () => {
      await expect(delegate()).rejects.toBeInstanceOf(UnconfirmedSubmitError)
    })
  })

  describe.each([
    ['payment', pay],
    ['delegate', delegate],
  ])('a %s submit the server rejects', (_path, send) => {
    // The server raises these before it sends any transaction.
    it.each([
      ['SIMULATION_FAILED', 'Transaction simulation failed.'],
      [
        'BLOCKHASH_EXPIRED',
        'Transaction blockhash has expired. Rebuild the transaction and sign it again.',
      ],
    ])(
      'with a defined %s keeps the rejection and its reason',
      async (code, message) => {
        const rejection = new ORPCError(code, { defined: true, message })
        mockClient.transactions.submit.mockRejectedValue(rejection)

        await act(async () => {
          const error = await send().catch((e: unknown) => e)
          expect(error).toBe(rejection)
          expect((error as Error).message).toBe(message)
        })
      },
    )

    // The server reports a failed or lost send as BAD_REQUEST, so it and
    // every other rejection may have landed the transactions.
    it.each([
      [
        'a defined BAD_REQUEST',
        new ORPCError('BAD_REQUEST', { defined: true }),
      ],
      ['a defined CONFLICT', new ORPCError('CONFLICT', { defined: true })],
      [
        'an undefined SIMULATION_FAILED',
        new ORPCError('SIMULATION_FAILED', { defined: false }),
      ],
      [
        'an undefined server error',
        new ORPCError('INTERNAL_SERVER_ERROR', { defined: false }),
      ],
    ])('with %s reports it as unconfirmed', async (_name, rejection) => {
      mockClient.transactions.submit.mockRejectedValue(rejection)

      await act(async () => {
        await expect(send()).rejects.toBeInstanceOf(UnconfirmedSubmitError)
      })
    })
  })
})
