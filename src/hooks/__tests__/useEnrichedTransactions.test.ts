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
}
const mockAnchorProvider = {}

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (key: string) => Promise.resolve(mockStorage[key] ?? null),
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
  getAllTransactions: () => Promise.resolve([]),
  onLogs: () => 1,
  removeAccountChangeListener: () => Promise.resolve(),
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const Probe = () => {
  useEnrichedTransactions()
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
    mockStorage['txs-devnet-addressA'] = JSON.stringify(A_TXS)
    mockState.cluster = 'devnet'
    mockState.currentAccount = ACCOUNT_A
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
})
