import AsyncStorage from '@react-native-async-storage/async-storage'
import { FetchFn, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import {
  RPC_REQUEST_TIMEOUT,
  WrappedConnection,
} from '../../utils/WrappedConnection'
import { AsyncAccountCache } from '../AsyncAccountCache'
import {
  RejectingAccountFetchCache,
  createAccountFetchCache,
} from '../RejectingAccountFetchCache'

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
  const fetchFn: FetchFn = (_input, init) => {
    calls += 1
    // Only the first request stalls, like one stalled socket on Android
    if (calls === 1) return new Promise(() => {})
    return Promise.resolve(accountResponse(String(init?.body)))
  }
  const connection = new WrappedConnection('https://rpc.test', {
    commitment: 'confirmed',
    fetch: fetchFn,
  })
  // A found account is watched; keep the websocket closed
  jest.spyOn(connection, 'onAccountChange').mockReturnValue(0)
  const asyncCache = new AsyncAccountCache('accounts-test')
  cache = createAccountFetchCache(connection, asyncCache)

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
  const fetchFn: FetchFn = (_input, init) => {
    const body = String(init?.body)
    if (body.includes(stalledKey.toBase58())) return new Promise(() => {})
    return Promise.resolve(accountResponse(body))
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

it('rejects a read still in the debounce window when the cache closes', async () => {
  const key = Keypair.generate().publicKey
  const connection = new WrappedConnection('https://rpc.test', {
    commitment: 'confirmed',
    fetch: (_input, init) =>
      Promise.resolve(accountResponse(String(init?.body))),
  })
  const asyncCache = new AsyncAccountCache('accounts-test')
  cache = createAccountFetchCache(connection, asyncCache)

  const read = settle(connection.getAccountInfo(key))
  await jest.advanceTimersByTimeAsync(50)
  cache.close()
  await jest.advanceTimersByTimeAsync(0)
  expect(read.status).toBe('rejected')
  expect(asyncCache.has(key.toBase58())).toBe(false)
  // Past the AsyncAccountCache write debounce
  await jest.advanceTimersByTimeAsync(10 * 1000)
  expect(storedKeys()).not.toContain(key.toBase58())
})

it('raises no unhandled rejection for a forceRequery read whose own batch fails', async () => {
  const unhandled: unknown[] = []
  const onUnhandled = (e: unknown) => unhandled.push(String(e))
  process.on('unhandledRejection', onUnhandled)
  const key = Keypair.generate().publicKey
  let calls = 0
  const fetchFn: FetchFn = async (_input, init) => {
    calls += 1
    // The first batch (the normal read) succeeds after 50 ms
    if (calls === 1) {
      await new Promise((r) => {
        setTimeout(r, 50)
      })
      return accountResponse(String(init?.body))
    }
    return new Response('upstream error', { status: 500 })
  }
  const connection = new WrappedConnection('https://rpc.test', {
    commitment: 'confirmed',
    fetch: fetchFn,
  })
  jest.spyOn(connection, 'onAccountChange').mockReturnValue(1)
  cache = new RejectingAccountFetchCache({
    connection,
    delay: 100,
    commitment: 'confirmed',
  })

  const read = cache.search(key)
  await jest.advanceTimersByTimeAsync(100)
  // A forceRequery read while the first batch is in flight, as
  // requeryMissingByAccount does
  const forced = cache.search(key, undefined, false, true)
  await jest.advanceTimersByTimeAsync(40 * 1000)
  expect(await read).toBeDefined()
  expect(await forced).toBeDefined()
  await jest.advanceTimersByTimeAsync(1000)
  jest.useRealTimers()
  await new Promise((r) => {
    setTimeout(r, 50)
  })
  process.off('unhandledRejection', onUnhandled)
  expect(calls).toBe(2)
  expect(unhandled).toEqual([])
})

it('disposes the watched keys of a getMultipleAccountsInfo call that fails', async () => {
  const cachedKey = Keypair.generate().publicKey
  const failingKey = Keypair.generate().publicKey
  const connection = new WrappedConnection('https://rpc.test', {
    commitment: 'confirmed',
    fetch: (_input, init) => {
      const body = String(init?.body)
      if (body.includes(failingKey.toBase58())) {
        return Promise.resolve(new Response('upstream error', { status: 500 }))
      }
      return Promise.resolve(accountResponse(body))
    },
  })
  jest.spyOn(connection, 'onAccountChange').mockReturnValue(1)
  jest.spyOn(connection, 'removeAccountChangeListener').mockResolvedValue()
  cache = new RejectingAccountFetchCache({
    connection,
    delay: 100,
    commitment: 'confirmed',
    missingRefetchDelay: 60 * 1000,
    extendConnection: true,
  })
  // Put cachedKey in the cache, then let its own 30 s dispose run
  const primed = connection.getAccountInfo(cachedKey)
  await jest.advanceTimersByTimeAsync(100)
  await primed
  await jest.advanceTimersByTimeAsync(31 * 1000)

  const result = settle(
    connection.getMultipleAccountsInfo([cachedKey, failingKey]),
  )
  await jest.advanceTimersByTimeAsync(40 * 1000)
  expect(result.status).toBe('rejected')
  expect(String(result.error)).toContain('upstream error')
  await jest.advanceTimersByTimeAsync(31 * 1000)
  expect(cache.accountWatchersCount.get(cachedKey.toBase58()) ?? 0).toBe(0)
})
