import { AccountFetchCache } from '@helium/account-fetch-cache'
import { FetchFn, Keypair, SystemProgram } from '@solana/web3.js'
import axios from 'axios'
import { RPC_REQUEST_TIMEOUT, WrappedConnection } from '../WrappedConnection'

// Jest does not resolve the app's import aliases
jest.mock('@utils/logger', () => ({}), { virtual: true })

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

it('fails a stalled RPC request after the timeout and aborts it', async () => {
  let requestInit: Parameters<FetchFn>[1]
  // A request that never settles, like one on Android's client with no timeout
  const stalledFetch: FetchFn = (_input, init) => {
    requestInit = init
    return new Promise(() => {})
  }
  const connection = new WrappedConnection('https://rpc.test', {
    fetch: stalledFetch,
  })

  let settled: 'pending' | 'resolved' | 'rejected' = 'pending'
  let error: unknown
  connection.getSlot().then(
    () => {
      settled = 'resolved'
    },
    (e) => {
      settled = 'rejected'
      error = e
    },
  )

  await jest.advanceTimersByTimeAsync(RPC_REQUEST_TIMEOUT - 1)
  expect(settled).toBe('pending')

  await jest.advanceTimersByTimeAsync(1)
  expect(settled).toBe('rejected')
  expect(String(error)).toContain('timed out')
  expect(requestInit?.signal?.aborted).toBe(true)
})

it('leaves no timer behind when the request settles first', async () => {
  const failingFetch: FetchFn = () => Promise.reject(new Error('network down'))
  const connection = new WrappedConnection('https://rpc.test', {
    fetch: failingFetch,
  })

  await expect(connection.getSlot()).rejects.toThrow('network down')
  expect(jest.getTimerCount()).toBe(0)
})

it('lets the next account cache read run after a stalled read times out', async () => {
  const stalledKey = Keypair.generate().publicKey
  const nextKey = Keypair.generate().publicKey
  const fetchFn: FetchFn = (_input, init) => {
    const body = String(init?.body)
    if (body.includes(stalledKey.toBase58())) return new Promise(() => {})
    const { id } = JSON.parse(body)
    return Promise.resolve(
      new Response(
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
      ),
    )
  }
  const cache = new AccountFetchCache({
    connection: new WrappedConnection('https://rpc.test', { fetch: fetchFn }),
    delay: 100,
    commitment: 'confirmed',
  })

  void cache.search(stalledKey)
  await jest.advanceTimersByTimeAsync(100)
  let next: Awaited<ReturnType<typeof cache.search>> | undefined
  void cache.search(nextKey).then((account) => {
    next = account
  })

  await jest.advanceTimersByTimeAsync(RPC_REQUEST_TIMEOUT + 100)
  expect(next?.account.data).toEqual(Buffer.from([7]))
  cache.close()
})

it.each<[string, (connection: WrappedConnection) => Promise<unknown>]>([
  ['getHealth', (connection) => connection.getHealth()],
  [
    'searchAssets',
    (connection) =>
      connection.searchAssets('https://rpc.test', { ownerAddress: 'owner' }),
  ],
  ['getAsset', (connection) => connection.getAsset('asset')],
  [
    'getAssetsByOwner',
    (connection) =>
      connection.getAssetsByOwner(
        'owner',
        { sortBy: 'created', sortDirection: 'asc' },
        10,
      ),
  ],
  ['getAssetProof', (connection) => connection.getAssetProof('asset')],
])('bounds the %s DAS call with the RPC timeout', async (_method, call) => {
  const post = jest
    .spyOn(axios, 'post')
    .mockResolvedValue({ data: { result: null } })

  await call(new WrappedConnection('https://rpc.test'))

  expect(post.mock.calls[0][2]).toMatchObject({ timeout: RPC_REQUEST_TIMEOUT })
})
