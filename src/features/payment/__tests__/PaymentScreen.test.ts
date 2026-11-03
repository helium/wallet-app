/**
 * Renders PaymentScreen with its real PaymentSubmit and PaymentError, and
 * drives Retry through the error stage as a user would. The payment and
 * batch-status hooks are replaced: the mutation is a real react-query
 * mutation around a fake send, and the batch status comes from a store the
 * test sets.
 */
import { NetTypes } from '@helium/address'
import { ORPCError } from '@orpc/client'
import { NATIVE_MINT } from '@solana/spl-token'
import {
  AddressLookupTableAccount,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import BN from 'bn.js'
import bs58 from 'bs58'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type useSubmitTxn from '../../../hooks/useSubmitTxn'
import type { BatchStatus } from '../../../hooks/useTransactionBatchStatus'
import { submitFailure } from '../../../utils/submitFailure'
import {
  CHECK_ACTIVITY_MESSAGE,
  UnconfirmedSubmitError,
} from '../../../utils/unconfirmedSubmitError'
import PaymentScreen from '../PaymentScreen'
import type usePaymentsReducer from '../usePaymentsReducer'

type Batch = {
  status: BatchStatus
  transactions: { signature: string; status: BatchStatus }[]
}
// The fake send takes and returns what the real payment mutation does.
type PaymentMutation = ReturnType<typeof useSubmitTxn>['paymentMutation']
type SendVariables = NonNullable<PaymentMutation['variables']>

const mockSend = jest.fn<
  Promise<NonNullable<PaymentMutation['data']>>,
  [SendVariables]
>()
// The wallet's balance of every mint; unloaded unless a test sets it.
let mockOwnedAmount: bigint | undefined
const mockBatchStore = {
  batches: {} as Record<string, Batch>,
  listeners: new Set<() => void>(),
}
const mockNavigation = {
  canGoBack: () => true,
  goBack: jest.fn(),
  popToTop: jest.fn(),
  reset: jest.fn(),
}
const mockRoute = { params: undefined }
const mockAccountStorage = {
  currentAccount: { address: 'payer', netType: NetTypes.MAINNET },
  currentNetworkAddress: 'payer',
  accounts: {},
  contacts: [],
  setCurrentAccount: jest.fn(),
  sortedAccountsForNetType: () => [],
}

const sender = Keypair.generate()
const alice = Keypair.generate().publicKey
const bob = Keypair.generate().publicKey

const mockPaymentState: ReturnType<typeof usePaymentsReducer>[0] = {
  payments: [
    { address: alice.toBase58(), amount: new BN(1) },
    { address: bob.toBase58(), amount: new BN(2) },
  ],
  totalAmount: new BN(3),
  mint: NATIVE_MINT,
  netType: NetTypes.MAINNET,
  networkFee: new BN(5000),
  balance: new BN(100),
  rentExemptLamports: 0,
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
jest.mock('../../../hooks/useSubmitTxn', () => {
  const { useMutation } = jest.requireActual('@tanstack/react-query')
  return () => {
    const paymentMutation = useMutation({ mutationFn: mockSend })
    return {
      paymentMutation,
      submitPayment: (payments: SendVariables['payments'], mint: PublicKey) =>
        paymentMutation.mutateAsync({ payments, mint }),
    }
  }
})
jest.mock('../../../hooks/useTransactionBatchStatus', () => {
  const { useSyncExternalStore } = jest.requireActual('react')
  const noTransactions: Batch['transactions'] = []
  const subscribe = (listener: () => void) => {
    mockBatchStore.listeners.add(listener)
    return () => mockBatchStore.listeners.delete(listener)
  }
  return {
    useTransactionBatchStatus: (batchId: string | null) => {
      const batches: Record<string, Batch> = useSyncExternalStore(
        subscribe,
        () => mockBatchStore.batches,
      )
      const batch = batchId ? batches[batchId] : undefined
      return {
        status: batch?.status,
        transactions: batch?.transactions ?? noTransactions,
        isLoading: false,
      }
    },
  }
})
jest.mock('../usePaymentsReducer', () => ({
  __esModule: true,
  default: () => [mockPaymentState, () => undefined],
  MAX_PAYMENTS: 10,
  paymentsSum: () => mockPaymentState.totalAmount,
}))

// Screen chrome and leaf views render as named host elements; wrappers keep
// their children so the submit view mounts.
jest.mock('@ui/AccountButton', () => ({ AccountButton: 'AccountButton' }), {
  virtual: true,
})
jest.mock(
  '@ui/AccountSelector',
  () => ({ AccountSelector: 'AccountSelector' }),
  { virtual: true },
)
jest.mock(
  '@ui/AddressBookSelector',
  () => ({ AddressBookSelector: 'AddressBookSelector' }),
  { virtual: true },
)
jest.mock('@ui/HNTKeyboard', () => ({ HNTKeyboard: 'HNTKeyboard' }), {
  virtual: true,
})
jest.mock('@ui/TokenButton', () => ({ TokenButton: 'TokenButton' }), {
  virtual: true,
})
jest.mock('@ui/TokenSelector', () => ({ TokenSelector: 'TokenSelector' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ FADE_IN: {} }), { virtual: true })
jest.mock('lucide-react-native', () => ({
  CircleX: 'CircleX',
  QrCode: 'QrCode',
  X: 'X',
}))
jest.mock('uniwind', () => ({ withUniwind: (icon: unknown) => icon }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('../PaymentCard', () => 'PaymentCard')
jest.mock('../PaymentItem', () => 'PaymentItem')
jest.mock('../PaymentSubmitLoading', () => 'PaymentSubmitLoading')
jest.mock('../PaymentSuccess', () => 'PaymentSuccess')
jest.mock('../PaymentSummary', () => 'PaymentSummary')

jest.mock(
  '@helium/helium-react-hooks',
  () => ({
    useMint: () => undefined,
    useOwnedAmount: () => ({ amount: mockOwnedAmount }),
  }),
  { virtual: true },
)
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'SOL' }) }),
  { virtual: true },
)
jest.mock('@hooks/usePublicKey', () => ({ usePublicKey: () => undefined }), {
  virtual: true,
})
jest.mock(
  '@storage/TokensProvider',
  () => ({ useVisibleTokens: () => ({ visibleTokens: [] }) }),
  { virtual: true },
)
jest.mock('@utils/constants', () => ({ Mints: {} }), { virtual: true })
jest.mock('@utils/getDomainOwner', () => ({ fetchDomainOwner: jest.fn() }), {
  virtual: true,
})
jest.mock(
  '@utils/solanaUtils',
  () => ({
    calcCreateAssociatedTokenAccountAccountFee: jest.fn(),
    humanReadable: () => '',
    parseTransactionError: (_balance: unknown, message: string) => message,
  }),
  { virtual: true },
)
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  Keyboard: { dismiss: () => undefined },
  Platform: { OS: 'ios' },
  View: 'View',
}))
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: 'KeyboardAwareScrollView',
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47 }),
}))
jest.mock('react-native-simple-toast', () => ({ show: () => undefined }))
jest.mock('../../../navigation/NavigationHelper', () => ({
  navigateToHomeScreen: jest.fn(),
}))
jest.mock('../../../solana/SolanaProvider', () => ({
  useSolana: () => ({}),
}))
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => mockAccountStorage,
}))
jest.mock('../../../utils/accountUtils', () => ({
  accountNetType: () => 0,
  formatAccountAlias: () => '',
  solAddressIsValid: () => true,
}))
jest.mock('../../../utils/logger', () => ({ error: () => undefined }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true
// Deliver mutation updates at once, so no test waits on a timer.
notifyManager.setScheduler((callback) => callback())

const signed = (
  instructions: TransactionInstruction[],
  lookupTables: AddressLookupTableAccount[] = [],
) => {
  const tx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: sender.publicKey,
      recentBlockhash: PublicKey.default.toBase58(),
      instructions,
    }).compileToV0Message(lookupTables),
  )
  tx.sign([sender])
  return tx
}
const signatureOf = (tx: VersionedTransaction) => bs58.encode(tx.signatures[0])
const sol = (to: PublicKey, lamports: number) =>
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: to,
    lamports,
  })

const setBatch = (batchId: string, batch: Batch) => {
  act(() => {
    mockBatchStore.batches = { ...mockBatchStore.batches, [batchId]: batch }
    mockBatchStore.listeners.forEach((listener) => listener())
  })
}

// The next send lands as a pending batch with these signed transactions.
const sendsAs = (batchId: string, transactions: VersionedTransaction[]) => {
  setBatch(batchId, { status: 'pending', transactions: [] })
  mockSend.mockImplementationOnce(async ({ payments }) => ({
    batchId,
    payments,
    transactions,
  }))
}

let renderer: TestRenderer.ReactTestRenderer

const render = () => {
  const queryClient = new QueryClient()
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(PaymentScreen),
      ),
    )
  })
}

const submit = async () => {
  const card = renderer.root.find(
    (node) => (node.type as string) === 'PaymentCard',
  )
  await act(async () => card.props.onSubmit())
}

const buttons = (label: string) =>
  renderer.root.findAll(
    (node) =>
      (node.type as string) === 'Button' && node.props.children === label,
  )

const retry = async () => {
  const retryButtons = buttons('generic.retry')
  expect(retryButtons.length).toBe(1)
  await act(async () => retryButtons[0]?.props.onPress())
}

const texts = (message: string) =>
  renderer.root.findAll(
    (node) =>
      (node.type as string) === 'Text' && node.props.children === message,
  )

const sentPayees = () =>
  mockSend.mock.calls.map(([{ payments }]) => payments.map((p) => p.payee))

describe('PaymentScreen Retry', () => {
  beforeEach(() => {
    mockSend.mockReset()
    mockBatchStore.batches = {}
  })
  afterEach(() => act(() => renderer.unmount()))

  it('resends only the unsent payments after a Retry that throws', async () => {
    const toAlice = signed([sol(alice, 1)])
    const toBob = signed([sol(bob, 2)])
    render()

    sendsAs('first', [toAlice, toBob])
    await submit()
    setBatch('first', {
      status: 'partial',
      transactions: [
        { signature: signatureOf(toAlice), status: 'confirmed' },
        { signature: signatureOf(toBob), status: 'failed' },
      ],
    })

    mockSend.mockRejectedValueOnce(new Error('Blockhash not found'))
    await retry()

    mockSend.mockReturnValueOnce(new Promise(() => undefined))
    await retry()

    expect(sentPayees()).toEqual([
      [alice.toBase58(), bob.toBase58()],
      [bob.toBase58()],
      [bob.toBase58()],
    ])
  })

  it('retries in the mint the failed batch was sent in after the form mint changes', async () => {
    const toAlice = signed([sol(alice, 1)])
    const toBob = signed([sol(bob, 2)])
    const otherMint = Keypair.generate().publicKey
    render()

    sendsAs('first', [toAlice, toBob])
    await submit()

    // A payment deep link changes the form's mint after the submit. The
    // screen is memoised, so the batch update below is what rerenders it.
    mockPaymentState.mint = otherMint
    try {
      setBatch('first', {
        status: 'partial',
        transactions: [
          { signature: signatureOf(toAlice), status: 'confirmed' },
          { signature: signatureOf(toBob), status: 'failed' },
        ],
      })

      mockSend.mockRejectedValueOnce(new Error('Blockhash not found'))
      await retry()
      expect(mockSend.mock.calls[1][0].mint).toEqual(NATIVE_MINT)

      mockSend.mockReturnValueOnce(new Promise(() => undefined))
      await retry()
      expect(mockSend.mock.calls[2][0].mint).toEqual(NATIVE_MINT)
    } finally {
      mockPaymentState.mint = NATIVE_MINT
    }
  })

  it('offers no Retry after a Retry whose submit got no answer', async () => {
    const toAlice = signed([sol(alice, 1)])
    const toBob = signed([sol(bob, 2)])
    render()

    sendsAs('first', [toAlice, toBob])
    await submit()
    setBatch('first', {
      status: 'partial',
      transactions: [
        { signature: signatureOf(toAlice), status: 'confirmed' },
        { signature: signatureOf(toBob), status: 'failed' },
      ],
    })

    // The resent payment to Bob reached the cluster, but its answer was lost.
    mockSend.mockRejectedValueOnce(
      new UnconfirmedSubmitError(new TypeError('Network request failed')),
    )
    await retry()

    expect(sentPayees()).toEqual([
      [alice.toBase58(), bob.toBase58()],
      [bob.toBase58()],
    ])
    expect(buttons('generic.cancel').length).toBe(1)
    expect(buttons('generic.retry').length).toBe(0)
  })

  it('shows the error with no Retry when the first submit got no answer', async () => {
    render()

    mockSend.mockRejectedValueOnce(
      new UnconfirmedSubmitError(new TypeError('Network request failed')),
    )
    await submit()

    expect(buttons('generic.cancel').length).toBe(1)
    expect(buttons('generic.retry').length).toBe(0)
  })

  it('shows the reason and resends every payment when the first submit was rejected before sending', async () => {
    render()

    // What the payment hook throws for this rejection.
    mockSend.mockRejectedValueOnce(
      submitFailure(
        new ORPCError('SIMULATION_FAILED', {
          defined: true,
          message: 'Simulation failed: insufficient funds',
        }),
      ),
    )
    await submit()

    expect(texts('Simulation failed: insufficient funds').length).toBe(1)
    mockSend.mockReturnValueOnce(new Promise(() => undefined))
    await retry()

    expect(sentPayees()).toEqual([
      [alice.toBase58(), bob.toBase58()],
      [alice.toBase58(), bob.toBase58()],
    ])
  })

  it('shows the check-activity message with no Retry when the first submit got an undefined rejection', async () => {
    render()

    // What the payment hook throws for this rejection.
    mockSend.mockRejectedValueOnce(
      submitFailure(new ORPCError('SIMULATION_FAILED', { defined: false })),
    )
    await submit()

    expect(texts(CHECK_ACTIVITY_MESSAGE).length).toBe(1)
    expect(buttons('generic.cancel').length).toBe(1)
    expect(buttons('generic.retry').length).toBe(0)
  })

  it('offers no Retry when a batch transaction loads accounts from a lookup table', async () => {
    const lookupTable = new AddressLookupTableAccount({
      key: Keypair.generate().publicKey,
      state: {
        deactivationSlot: BigInt('18446744073709551615'),
        lastExtendedSlot: 0,
        lastExtendedSlotStartIndex: 0,
        addresses: [bob],
      },
    })
    // Bob's failed transaction names him in its static keys, so matching keys
    // alone would offer Retry; the confirmed one also pays him through the
    // table.
    const toAlice = signed([sol(alice, 1)])
    const toBob = signed([sol(bob, 1)])
    const viaTable = signed([sol(bob, 1)], [lookupTable])
    render()

    sendsAs('first', [toAlice, toBob, viaTable])
    await submit()
    setBatch('first', {
      status: 'partial',
      transactions: [
        { signature: signatureOf(toAlice), status: 'confirmed' },
        { signature: signatureOf(toBob), status: 'failed' },
        { signature: signatureOf(viaTable), status: 'confirmed' },
      ],
    })

    expect(buttons('generic.cancel').length).toBe(1)
    expect(buttons('generic.retry').length).toBe(0)
  })
})

describe('PaymentScreen header', () => {
  afterEach(() => act(() => renderer.unmount()))

  // Home slides Send up as a full-screen card, so on iOS the header must clear
  // the status bar even when the screen can go back.
  it('sits below the top inset on iOS when it can go back', () => {
    render()

    const header = renderer.root.find(
      (node) =>
        (node.type as string) === 'View' &&
        node.props.className === 'flex-1 rounded-t-[20px] bg-secondary',
    )
    expect(header.props.style).toEqual({ marginTop: 47 })
  })
})

const paymentCard = () =>
  renderer.root.find((node) => (node.type as string) === 'PaymentCard')

describe('PaymentScreen Send', () => {
  beforeEach(() => {
    mockSend.mockReset()
    mockBatchStore.batches = {}
  })
  afterEach(() => act(() => renderer.unmount()))

  it('sends once for two swipes in one tick, and again after the send settles', async () => {
    render()
    let settle!: (sent: Awaited<ReturnType<typeof mockSend>>) => void
    mockSend.mockReturnValueOnce(
      new Promise((resolve) => {
        settle = resolve
      }),
    )

    const card = paymentCard()
    await act(async () => {
      card.props.onSubmit()
      card.props.onSubmit()
    })
    expect(mockSend).toHaveBeenCalledTimes(1)

    await act(async () =>
      settle({ batchId: 'first', payments: [], transactions: [] }),
    )
    mockSend.mockReturnValueOnce(new Promise(() => undefined))
    await submit()
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('disables Send while the payment is pending', async () => {
    // A balance that covers the payments and the fee, so the form is valid.
    mockOwnedAmount = BigInt(1_000_000)
    try {
      render()
      mockSend.mockReturnValueOnce(new Promise(() => undefined))
      expect(paymentCard().props.disabled).toBe(false)

      await submit()

      expect(paymentCard().props.disabled).toBe(true)
    } finally {
      mockOwnedAmount = undefined
    }
  })
})
