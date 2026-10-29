import React from 'react'
import TestRenderer, { act, ReactTestRenderer } from 'react-test-renderer'
import { QueryClientProvider } from '@tanstack/react-query'
import useCollectables from '../useCollectables'
import { createQueryClient } from '../../utils/queryClient'
import { getNFTs } from '../../utils/solanaUtils'

const FETCH_MS = 100

let mockLocked = true

jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({
    cluster: 'devnet',
    anchorProvider: { connection: {} },
  }),
}))
jest.mock('../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({
    currentAccount: {
      solanaAddress: 'Bm2vA8wWNmYGUTK3oAXZG8eAWmzwYMfCWm3hwzpEnFd4',
    },
  }),
}))
jest.mock('../../storage/AppStorageProvider', () => ({
  useAppStorage: () => ({ locked: mockLocked }),
}))
jest.mock('../../utils/solanaUtils', () => ({
  // Each fetch takes FETCH_MS of the fake clock
  getNFTs: jest.fn(
    () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
  ),
  getNFTsMetadata: jest.fn(async () => []),
  groupNFTs: jest.fn(() => ({})),
  groupNFTsWithMetaData: jest.fn(() => ({})),
  onLogs: jest.fn(() => 1),
  removeAccountChangeListener: jest.fn(),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let hook: ReturnType<typeof useCollectables>
const Harness = () => {
  hook = useCollectables()
  return null
}

let queryClient: ReturnType<typeof createQueryClient>
let renderer: ReactTestRenderer

const tree = () =>
  React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(Harness),
  )

const mount = async () => {
  await act(async () => {
    renderer = TestRenderer.create(tree())
  })
}

const unlock = async () => {
  mockLocked = false
  await act(async () => {
    renderer.update(tree())
  })
}

const advance = async (ms: number) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms)
  })
}

const refresh = async () => {
  await act(async () => {
    hook.refresh()
  })
}

beforeEach(() => {
  jest.useFakeTimers()
  jest.mocked(getNFTs).mockClear()
  mockLocked = true
  queryClient = createQueryClient()
})

afterEach(async () => {
  await act(async () => {
    renderer.unmount()
  })
  queryClient.clear()
  jest.useRealTimers()
})

describe('useCollectables', () => {
  it('fetches nothing while locked', async () => {
    await mount()
    await refresh()
    await advance(FETCH_MS)

    expect(getNFTs).toHaveBeenCalledTimes(0)
  })

  it('fetches once after unlock', async () => {
    await mount()
    await unlock()
    await advance(FETCH_MS)

    expect(getNFTs).toHaveBeenCalledTimes(1)
  })

  // A refetch can only restart a fetch once the query holds data
  it('joins a fetch in flight instead of restarting it', async () => {
    await mount()
    await unlock()
    await advance(FETCH_MS + 5_000)
    expect(getNFTs).toHaveBeenCalledTimes(1)

    await refresh()
    await refresh()
    await advance(FETCH_MS)

    expect(getNFTs).toHaveBeenCalledTimes(2)
  })

  it('skips a refresh within 5 seconds of a fetch', async () => {
    await mount()
    await unlock()
    await advance(FETCH_MS)
    expect(getNFTs).toHaveBeenCalledTimes(1)

    await refresh()
    await advance(FETCH_MS)
    expect(getNFTs).toHaveBeenCalledTimes(1)

    await advance(5_000)
    await refresh()
    await advance(FETCH_MS)
    expect(getNFTs).toHaveBeenCalledTimes(2)
  })
})
