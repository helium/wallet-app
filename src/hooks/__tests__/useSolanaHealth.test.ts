import React from 'react'
import TestRenderer, { act, ReactTestRenderer } from 'react-test-renderer'
import { QueryClientProvider } from '@tanstack/react-query'
import useSolanaHealth, {
  solanaHealthQuery,
  solanaTpsQuery,
} from '../useSolanaHealth'
import { createQueryClient } from '../../utils/queryClient'
import { getCurrentTPS } from '../../utils/solanaUtils'
import { WrappedConnection } from '../../utils/WrappedConnection'

const connection = (
  rpcEndpoint: string,
  getHealth: () => Promise<unknown> = async () => ({ result: 'ok' }),
) => ({ rpcEndpoint, getHealth } as unknown as WrappedConnection)

let mockConnection: WrappedConnection | undefined

jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({
    anchorProvider: mockConnection ? { connection: mockConnection } : undefined,
  }),
}))
jest.mock('../../utils/solanaUtils', () => ({
  getCurrentTPS: jest.fn(),
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { tps: string }) =>
      opts ? `${key} ${opts.tps}` : key,
  }),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

let hook: ReturnType<typeof useSolanaHealth>
const Harness = () => {
  hook = useSolanaHealth()
  return null
}

let queryClient: ReturnType<typeof createQueryClient>
let renderer: ReactTestRenderer | undefined

const mount = async () => {
  queryClient = createQueryClient()
  await act(async () => {
    renderer = TestRenderer.create(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(Harness),
      ),
    )
  })
  // Let both reads settle and re-render
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0)
  })
}

describe('solana health queries', () => {
  it.each([
    ['health', solanaHealthQuery],
    ['tps', solanaTpsQuery],
  ])('keys the %s read by rpc endpoint', (_, query) => {
    expect(query(connection('https://rpc-a')).queryKey).toEqual(
      query(connection('https://rpc-a')).queryKey,
    )
    expect(query(connection('https://rpc-b')).queryKey).not.toEqual(
      query(connection('https://rpc-a')).queryKey,
    )
    expect(query(connection('https://rpc-a')).enabled).toBe(true)
    expect(query(undefined).enabled).toBe(false)
  })

  it('fails the health read when the probe gets no answer', async () => {
    const client = createQueryClient()
    await expect(
      client.fetchQuery(
        solanaHealthQuery(connection('https://rpc-a', async () => undefined)),
      ),
    ).rejects.toThrow()
    client.clear()
  })
})

describe('useSolanaHealth', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.mocked(getCurrentTPS).mockReset().mockResolvedValue(3000)
  })

  afterEach(() => {
    act(() => renderer?.unmount())
    queryClient.clear()
    jest.useRealTimers()
  })

  it('is healthy when the probe answers ok and tps is high', async () => {
    mockConnection = connection('https://rpc-a')
    await mount()

    expect(hook.isHealthy).toBe(true)
    expect(hook.healthMessage).toBe('generic.solanaHealthy')
  })

  it('is unhealthy when the probe answers anything but ok', async () => {
    mockConnection = connection('https://rpc-a', async () => ({
      error: { message: 'Node is behind' },
    }))
    await mount()

    expect(hook.isHealthy).toBe(false)
    expect(hook.healthMessage).toBe('generic.solanaHealthDown')
  })

  it('is unhealthy and shows the tps when tps is 2000 or less', async () => {
    jest.mocked(getCurrentTPS).mockResolvedValue(2000)
    mockConnection = connection('https://rpc-a')
    await mount()

    expect(hook.isHealthy).toBe(false)
    expect(hook.healthMessage).toBe('generic.solanaTpsSlow 2000.00')
  })

  it('stays healthy while there is no connection', async () => {
    mockConnection = undefined
    await mount()

    expect(hook.isHealthy).toBe(true)
    expect(getCurrentTPS).not.toHaveBeenCalled()
  })
})
