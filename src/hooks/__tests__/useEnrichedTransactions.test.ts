import React from 'react'
import TestRenderer, { act, ReactTestRenderer } from 'react-test-renderer'
import useEnrichedTransactions from '../useEnrichedTransactions'

const ACCOUNT_A = { solanaAddress: 'addressA' }
const ACCOUNT_B = { solanaAddress: 'addressB' }
const A_TXS = [{ signature: 'sigA1' }, { signature: 'sigA2' }]

const mockStorage: Record<string, string> = {}
const mockSetItem = jest.fn((key: string, value: string) => {
  mockStorage[key] = value
  return Promise.resolve()
})
const mockState = {
  cluster: 'devnet',
  currentAccount: ACCOUNT_A as { solanaAddress: string } | undefined,
  // When true, each getAllTransactions call waits until the test resolves it
  deferFetches: false,
  // When true, each AsyncStorage.getItem call waits until the test resolves it
  deferGetItem: false,
}
const mockAnchorProvider = {}
// Deferred getAllTransactions calls, keyed by `${cluster}-${address}-${before}`
const mockPending: Record<string, (txs: { signature: string }[]) => void> = {}
// Every deferred getAllTransactions call, including ones whose key repeats
const mockAllPending: Array<(txs: { signature: string }[]) => void> = []
// Deferred AsyncStorage.getItem calls, keyed by storage key
const mockPendingGetItem: Record<string, () => void> = {}
const mockGetItem = (key: string) => {
  if (!mockState.deferGetItem) {
    return Promise.resolve(mockStorage[key] ?? null)
  }
  return new Promise((resolve) => {
    mockPendingGetItem[key] = () => resolve(mockStorage[key] ?? null)
  })
}
// Latest onLogs callback per subscribed address
const mockOnLogsCallbacks: Record<string, () => void> = {}
const mockGetAllTransactions = (
  address: string,
  _provider: unknown,
  cluster: string,
  before?: string,
) => {
  if (!mockState.deferFetches) return Promise.resolve([])
  return new Promise((resolve) => {
    mockPending[`${cluster}-${address}-${before ?? ''}`] = resolve
    mockAllPending.push(resolve)
  })
}

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (key: string) => mockGetItem(key),
  setItem: (key: string, value: string) => mockSetItem(key, value),
}))
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({
    cluster: mockState.cluster,
    anchorProvider: mockAnchorProvider,
  }),
}))
jest.mock('../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ currentAccount: mockState.currentAccount }),
}))
jest.mock('../../utils/solanaUtils', () => ({
  getAllTransactions: (
    address: string,
    provider: unknown,
    cluster: string,
    before?: string,
  ) => mockGetAllTransactions(address, provider, cluster, before),
  onLogs: (_provider: unknown, address: string, callback: () => void) => {
    mockOnLogsCallbacks[address] = callback
    return 1
  },
  removeAccountChangeListener: () => Promise.resolve(),
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

let hookResult: ReturnType<typeof useEnrichedTransactions> | undefined
const Probe = () => {
  const result = useEnrichedTransactions()
  React.useEffect(() => {
    hookResult = result
  })
  return null
}

const renderProbe = async () => {
  let renderer: ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(React.createElement(Probe))
  })
  return renderer as ReactTestRenderer
}

const rerenderProbe = async (renderer: ReactTestRenderer) => {
  await act(async () => {
    renderer.update(React.createElement(Probe))
  })
}

const writesOfATxsUnder = (key: string) =>
  mockSetItem.mock.calls.filter(
    ([k, value]) => k === key && value.includes('sigA1'),
  )

describe('useEnrichedTransactions', () => {
  beforeEach(() => {
    mockSetItem.mockClear()
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
    Object.keys(mockPending).forEach((key) => delete mockPending[key])
    mockAllPending.length = 0
    Object.keys(mockPendingGetItem).forEach(
      (key) => delete mockPendingGetItem[key],
    )
    Object.keys(mockOnLogsCallbacks).forEach(
      (key) => delete mockOnLogsCallbacks[key],
    )
    mockStorage['txs-devnet-addressA'] = JSON.stringify(A_TXS)
    mockState.cluster = 'devnet'
    mockState.currentAccount = ACCOUNT_A
    mockState.deferFetches = false
    mockState.deferGetItem = false
  })

  it('does not cache account A history under account B', async () => {
    const renderer = await renderProbe()
    expect(writesOfATxsUnder('txs-devnet-addressA')).not.toHaveLength(0)

    mockState.currentAccount = ACCOUNT_B
    await rerenderProbe(renderer)

    expect(writesOfATxsUnder('txs-devnet-addressB')).toHaveLength(0)
  })

  it('does not cache devnet history under another cluster', async () => {
    const renderer = await renderProbe()
    expect(writesOfATxsUnder('txs-devnet-addressA')).not.toHaveLength(0)

    mockState.cluster = 'mainnet-beta'
    await rerenderProbe(renderer)

    expect(writesOfATxsUnder('txs-mainnet-beta-addressA')).toHaveLength(0)
  })

  it('drops a refresh for account A that lands after a switch to B', async () => {
    delete mockStorage['txs-devnet-addressA']
    mockState.deferFetches = true
    const renderer = await renderProbe()
    // No cache for A, so the load effect started refresh() for A
    expect(mockPending['devnet-addressA-']).toBeDefined()

    mockState.currentAccount = ACCOUNT_B
    await rerenderProbe(renderer)
    await act(async () => {
      mockPending['devnet-addressA-']([{ signature: 'sigA1' }])
    })

    expect(writesOfATxsUnder('txs-devnet-addressB')).toHaveLength(0)
  })

  it('drops a fetchMore for account A that lands after a switch to B', async () => {
    mockState.deferFetches = true
    const renderer = await renderProbe()
    await act(async () => {
      void hookResult?.fetchMore()
    })
    expect(mockPending['devnet-addressA-sigA2']).toBeDefined()

    mockState.currentAccount = ACCOUNT_B
    await rerenderProbe(renderer)
    await act(async () => {
      mockPending['devnet-addressA-sigA2']([{ signature: 'sigA3' }])
    })

    expect(
      mockSetItem.mock.calls.filter(
        ([k, value]) => k === 'txs-devnet-addressB' && value.includes('sigA3'),
      ),
    ).toHaveLength(0)
  })

  it('drops a devnet refresh that lands after a switch to mainnet-beta', async () => {
    delete mockStorage['txs-devnet-addressA']
    mockState.deferFetches = true
    const renderer = await renderProbe()
    expect(mockPending['devnet-addressA-']).toBeDefined()

    mockState.cluster = 'mainnet-beta'
    await rerenderProbe(renderer)
    await act(async () => {
      mockPending['devnet-addressA-']([{ signature: 'sigA1' }])
    })

    expect(writesOfATxsUnder('txs-mainnet-beta-addressA')).toHaveLength(0)
  })

  it('drops a fetchNew for account A that lands after a switch to B', async () => {
    mockState.deferFetches = true
    const renderer = await renderProbe()
    // A has cached history, so only the new-logs fetch is pending for A
    await act(async () => {
      mockOnLogsCallbacks.addressA()
    })
    expect(mockPending['devnet-addressA-']).toBeDefined()

    mockState.currentAccount = ACCOUNT_B
    await rerenderProbe(renderer)
    await act(async () => {
      mockPending['devnet-addressA-']([{ signature: 'sigA5' }])
    })

    expect(
      mockSetItem.mock.calls.filter(
        ([k, value]) => k === 'txs-devnet-addressB' && value.includes('sigA5'),
      ),
    ).toHaveLength(0)
  })

  it('drops a cache load for account A that lands after a switch to B', async () => {
    mockState.deferGetItem = true
    const renderer = await renderProbe()
    expect(mockPendingGetItem['txs-devnet-addressA']).toBeDefined()

    mockState.currentAccount = ACCOUNT_B
    await rerenderProbe(renderer)
    await act(async () => {
      mockPendingGetItem['txs-devnet-addressA']()
    })

    expect(JSON.stringify(hookResult?.transactions)).not.toContain('sigA1')
    expect(writesOfATxsUnder('txs-devnet-addressB')).toHaveLength(0)
  })

  it('clears loading flags on an account switch while A fetches', async () => {
    delete mockStorage['txs-devnet-addressA']
    mockStorage['txs-devnet-addressB'] = JSON.stringify([
      { signature: 'sigB1' },
    ])
    mockState.deferFetches = true
    const renderer = await renderProbe()
    await act(async () => {
      void hookResult?.fetchMore()
    })
    expect(hookResult?.loading).toBe(true)
    expect(hookResult?.fetchingMore).toBe(true)

    mockState.currentAccount = ACCOUNT_B
    await rerenderProbe(renderer)
    expect(hookResult?.loading).toBe(false)
    expect(hookResult?.fetchingMore).toBe(false)

    await act(async () => {
      mockAllPending.forEach((resolve) => resolve([{ signature: 'sigA1' }]))
    })
    expect(hookResult?.loading).toBe(false)
    expect(hookResult?.fetchingMore).toBe(false)
  })

  it('clears loading flags on a cluster switch while devnet fetches', async () => {
    delete mockStorage['txs-devnet-addressA']
    mockStorage['txs-mainnet-beta-addressA'] = JSON.stringify([
      { signature: 'sigM1' },
    ])
    mockState.deferFetches = true
    const renderer = await renderProbe()
    await act(async () => {
      void hookResult?.fetchMore()
    })
    expect(hookResult?.loading).toBe(true)
    expect(hookResult?.fetchingMore).toBe(true)

    mockState.cluster = 'mainnet-beta'
    await rerenderProbe(renderer)
    expect(hookResult?.loading).toBe(false)
    expect(hookResult?.fetchingMore).toBe(false)

    await act(async () => {
      mockAllPending.forEach((resolve) => resolve([{ signature: 'sigA1' }]))
    })
    expect(hookResult?.loading).toBe(false)
    expect(hookResult?.fetchingMore).toBe(false)
  })
})
