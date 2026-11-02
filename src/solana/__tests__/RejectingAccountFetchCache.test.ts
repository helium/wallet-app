import AsyncStorage from '@react-native-async-storage/async-storage'
import { FetchFn, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import {
  RPC_REQUEST_TIMEOUT,
  WrappedConnection,
} from '../../utils/WrappedConnection'
import { AsyncAccountCache } from '../AsyncAccountCache'
import { RejectingAccountFetchCache } from '../RejectingAccountFetchCache'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
}))
// Jest does not resolve the app's import aliases
jest.mock('@utils/logger', () => ({}), { virtual: true })

const setItem = AsyncStorage.setItem as jest.Mock

const accountResponse = (body: string) => {
  const { id } = JSON.parse(body)
  return new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      id,
      result: {
        context: { slot: 1 },
        value: [
          {
            data: [Buffer.from([7]).toString('base64'), 'base64'],
            executable: false,
            lamports: 1,
            owner: SystemProgram.programId.toBase58(),
            rentEpoch: 0,
          },
        ],
      },
    }),
  )
}

const settle = (promise: Promise<unknown>) => {
  const state: { status: string; value?: unknown; error?: unknown } = {
    status: 'pending',
  }
  promise.then(
    (value) => {
      state.status = 'resolved'
      state.value = value
    },
    (error) => {
      state.status = 'rejected'
      state.error = error
    },
  )
  return state
}

const storedKeys = () =>
  setItem.mock.calls.flatMap(([, data]) =>
    (JSON.parse(data) as [string, unknown][]).map(([key]) => key),
  )

let cache: RejectingAccountFetchCache | undefined

beforeEach(() => {
  jest.useFakeTimers()
  setItem.mockClear()
})

afterEach(() => {
  cache?.close()
  cache = undefined
  jest.useRealTimers()
})

it('caches no null for a failed batch and fetches the key again on the next read', async () => {
  const key = Keypair.generate().publicKey
  let calls = 0
  const fetchFn: FetchFn = async (_input, init) => {
    calls += 1
    // Only the first request stalls, like one stalled socket on Android
    if (calls === 1) return new Promise(() => {})
    return accountResponse(String(init?.body))
  }
  const connection = new WrappedConnection('https://rpc.test', {
    commitment: 'confirmed',
    fetch: fetchFn,
  })
  // A found account is watched; keep the websocket closed
  jest.spyOn(connection, 'onAccountChange').mockReturnValue(0)
  const asyncCache = new AsyncAccountCache('accounts-test')
  // Same options as SolanaProvider
  cache = new RejectingAccountFetchCache({
    connection,
    delay: 100,
    commitment: 'confirmed',
    missingRefetchDelay: 60 * 1000,
    extendConnection: true,
    cache: asyncCache,
  })

  const first = settle(connection.getAccountInfo(key))
  await jest.advanceTimersByTimeAsync(100 + RPC_REQUEST_TIMEOUT)
  expect(asyncCache.has(key.toBase58())).toBe(false)
  // Past the AsyncAccountCache write debounce
  await jest.advanceTimersByTimeAsync(10 * 1000)
  expect(storedKeys()).not.toContain(key.toBase58())
  expect(first.status).toBe('rejected')
  expect(String(first.error)).toContain('timed out')

  const second = settle(connection.getAccountInfo(key))
  await jest.advanceTimersByTimeAsync(100)
  expect(second.status).toBe('resolved')
  expect(calls).toBe(2)
  expect((second.value as { data: Buffer }).data).toEqual(Buffer.from([7]))
})

it('lets a read issued during a stalled batch fetch its own key after the timeout', async () => {
  const stalledKey = Keypair.generate().publicKey
  const nextKey = Keypair.generate().publicKey
  const fetchFn: FetchFn = async (_input, init) => {
    const body = String(init?.body)
    if (body.includes(stalledKey.toBase58())) return new Promise(() => {})
    return accountResponse(body)
  }
  cache = new RejectingAccountFetchCache({
    connection: new WrappedConnection('https://rpc.test', { fetch: fetchFn }),
    delay: 100,
    commitment: 'confirmed',
  })

  const stalled = settle(cache.search(stalledKey))
  await jest.advanceTimersByTimeAsync(100)
  const next = settle(cache.search(nextKey))

  await jest.advanceTimersByTimeAsync(RPC_REQUEST_TIMEOUT + 100)
  expect(stalled.status).toBe('rejected')
  expect(next.status).toBe('resolved')
  expect(
    (next.value as { account: { data: Buffer }; pubkey: PublicKey }).account
      .data,
  ).toEqual(Buffer.from([7]))
})
