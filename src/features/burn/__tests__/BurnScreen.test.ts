/**
 * Renders BurnScreen (as a DC delegate) with the real PaymentSubmit and
 * PaymentError, and drives Retry through the error stage as a user would.
 * The submit and batch-status hooks are replaced: the mutation is a real
 * react-query mutation around a fake delegate, and the batch status comes
 * from a store the test sets.
 */
import { IOT_MINT } from '@helium/spl-utils'
import { PublicKey } from '@solana/web3.js'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type useSubmitTxn from '../../../hooks/useSubmitTxn'
import type { BatchStatus } from '../../../hooks/useTransactionBatchStatus'
import BurnScreen from '../BurnScreen'

type Batch = {
  status: BatchStatus
  transactions: { signature: string; status: BatchStatus }[]
}
// The fake delegate takes and returns what the real delegate mutation does.
type DelegateMutation = ReturnType<
  typeof useSubmitTxn
>['delegateDataCreditsMutation']

const mockDelegate = jest.fn<
  Promise<NonNullable<DelegateMutation['data']>>,
  [NonNullable<DelegateMutation['variables']>]
>()
const mockBatchStore = {
  batches: {} as Record<string, Batch>,
  listeners: new Set<() => void>(),
}
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  popToTop: jest.fn(),
}
const mockRoute = {
  params: {
    isDelegate: true,
    address: 'routerKey',
    amount: '100',
    mint: IOT_MINT.toBase58(),
    memo: 'memo',
  },
}
const mockAccountStorage = {
  accounts: {},
  currentAccount: { address: 'payer' },
  sortedAccountsForNetType: () => [],
  setCurrentAccount: jest.fn(),
  defaultAccountAddress: undefined,
}

jest.mock('../../../hooks/useSubmitTxn', () => {
  const { useMutation } = jest.requireActual('@tanstack/react-query')
  return () => {
    const delegateDataCreditsMutation = useMutation({
      mutationFn: mockDelegate,
    })
    return {
      delegateDataCreditsMutation,
      submitDelegateDataCredits: (
        delegateAddress: string,
        amount: number,
        mint: PublicKey,
        memo?: string,
      ) =>
        delegateDataCreditsMutation.mutateAsync({
          delegateAddress,
          amount,
          mint,
          memo,
        }),
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

// Screen chrome and leaf views render as named host elements; wrappers keep
// their children so the submit view mounts.
jest.mock('@assets/images/paymentFailure.svg', () => 'FailureIcon', {
  virtual: true,
})
jest.mock('@components/AccountButton', () => 'AccountButton', {
  virtual: true,
})
jest.mock('@components/AccountSelector', () => 'AccountSelector', {
  virtual: true,
})
jest.mock('@components/BackgroundFill', () => 'BackgroundFill', {
  virtual: true,
})
jest.mock('@components/Box', () => 'Box', { virtual: true })
jest.mock('@components/FadeInOut', () => 'FadeInOut', { virtual: true })
jest.mock('@components/SubmitButton', () => 'SubmitButton', {
  virtual: true,
})
jest.mock('@components/Text', () => 'Text', { virtual: true })
jest.mock('@components/TokenButton', () => 'TokenButton', { virtual: true })
jest.mock('@components/TokenSelector', () => 'TokenSelector', {
  virtual: true,
})
jest.mock('@components/TouchableOpacityBox', () => 'TouchableOpacityBox', {
  virtual: true,
})
jest.mock('../../../components/AddressBookSelector', () => 'AddressBook')
jest.mock('../../../components/HNTKeyboard', () => 'HNTKeyboard')
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'UiText' }), { virtual: true })
jest.mock('lucide-react-native', () => ({ QrCode: 'QrCode', X: 'X' }))
jest.mock('uniwind', () => ({
  withUniwind: (component: unknown) => component,
}))
jest.mock('../../payment/PaymentItem', () => 'PaymentItem')
jest.mock('../../payment/PaymentSubmitLoading', () => 'PaymentSubmitLoading')
jest.mock('../../payment/PaymentSuccess', () => 'PaymentSuccess')
jest.mock('../../payment/PaymentSummary', () => 'PaymentSummary')

jest.mock(
  '@helium/helium-react-hooks',
  () => ({
    useOwnedAmount: () => ({ amount: undefined }),
    useSolOwnedAmount: () => ({ amount: undefined }),
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/useAlert',
  () => () => ({ showOKAlert: () => Promise.resolve() }),
  { virtual: true },
)
jest.mock('@hooks/useBN', () => ({ useBN: () => undefined }), {
  virtual: true,
})
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'IOT' }) }),
  { virtual: true },
)
jest.mock('@theme/themeHooks', () => ({ useHitSlop: () => undefined }), {
  virtual: true,
})
jest.mock('@theme/globalStyles', () => ({ container: {} }), { virtual: true })
jest.mock(
  '@utils/solanaUtils',
  () => ({
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
  Platform: { OS: 'ios' },
  StyleSheet: { absoluteFill: {} },
  View: 'View',
}))
jest.mock('react-native-keyboard-controller', () => ({
  KeyboardAwareScrollView: 'KeyboardAwareScrollView',
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0 }),
}))
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => mockAccountStorage,
}))
jest.mock('../../../utils/Balance', () => ({
  useBalance: () => ({ networkTokensToDc: () => undefined }),
}))
jest.mock('../../../utils/accountUtils', () => ({
  accountNetType: () => 0,
  ellipsizeAddress: () => '',
  formatAccountAlias: () => '',
  solAddressIsValid: () => true,
}))
jest.mock('../../../utils/solanaUtils', () => ({ TXN_FEE_IN_SOL: 5000 }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true
// Deliver mutation updates at once, so no test waits on a timer.
notifyManager.setScheduler((callback) => callback())

const setBatch = (batchId: string, batch: Batch) => {
  act(() => {
    mockBatchStore.batches = { ...mockBatchStore.batches, [batchId]: batch }
    mockBatchStore.listeners.forEach((listener) => listener())
  })
}

// The next delegate lands as a pending batch.
const delegatesAs = (batchId: string) => {
  setBatch(batchId, { status: 'pending', transactions: [] })
  mockDelegate.mockResolvedValueOnce(batchId)
}

let renderer: TestRenderer.ReactTestRenderer

const render = () => {
  const queryClient = new QueryClient()
  act(() => {
    renderer = TestRenderer.create(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(BurnScreen),
      ),
    )
  })
}

const submit = async () => {
  const button = renderer.root.find(
    (node) => (node.type as string) === 'SubmitButton',
  )
  await act(async () => button.props.onSubmit())
}

const buttons = (label: string) =>
  renderer.root
    .findAll(
      (node) =>
        (node.type as string) === 'Text' && node.props.children === label,
    )
    .map((text) => text.parent)

const retry = async () => {
  const retryButtons = buttons('generic.retry')
  expect(retryButtons.length).toBe(1)
  await act(async () => retryButtons[0]?.props.onPress())
}

const sentDelegates = () =>
  mockDelegate.mock.calls.map(([{ delegateAddress, amount, mint, memo }]) => [
    delegateAddress,
    amount,
    mint.toBase58(),
    memo,
  ])

describe('BurnScreen Retry', () => {
  beforeEach(() => {
    mockDelegate.mockReset()
    mockBatchStore.batches = {}
  })
  afterEach(() => act(() => renderer.unmount()))

  it('resends the delegate after its transaction failed and after a Retry that throws', async () => {
    render()

    delegatesAs('first')
    await submit()
    setBatch('first', {
      status: 'failed',
      transactions: [{ signature: 'delegateSig', status: 'failed' }],
    })

    mockDelegate.mockRejectedValueOnce(new Error('Blockhash not found'))
    await retry()

    mockDelegate.mockReturnValueOnce(new Promise(() => undefined))
    await retry()

    const delegate = ['routerKey', 100, IOT_MINT.toBase58(), 'memo']
    expect(sentDelegates()).toEqual([delegate, delegate, delegate])
  })

  it('offers no Retry when the batch expired', async () => {
    render()

    delegatesAs('first')
    await submit()
    setBatch('first', {
      status: 'expired',
      transactions: [{ signature: 'delegateSig', status: 'expired' }],
    })

    expect(buttons('generic.cancel').length).toBe(1)
    expect(buttons('generic.retry').length).toBe(0)
  })
})
