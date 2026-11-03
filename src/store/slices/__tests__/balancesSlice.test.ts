import { AnchorProvider } from '@anchor-lang/core'
import { AccountFetchCache } from '@helium/account-fetch-cache'
import { DC_MINT, HNT_MINT } from '@helium/spl-utils'
import {
  AccountLayout,
  AccountState,
  MintLayout,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import {
  AccountInfo,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js'
import { CSAccount } from '../../../storage/cloudStorage'
import { AccountBalance } from '../../../types/balance'
import {
  TOKEN_SYNC_TIMEOUT,
  syncTokenAccounts,
  tokenAccountsQueryOptions,
} from '../../../utils/balances'
import { createQueryClient } from '../../../utils/queryClient'
import { getBalanceHistory, getTokenPrices } from '../../../utils/walletApiV2'
import {
  BalancesPort,
  clearBalancesPorts,
  tanstackBalancesPort,
} from './balancesPort'

jest.mock('../../../utils/walletApiV2', () => ({
  getTokenPrices: jest.fn(),
  getBalanceHistory: jest.fn(),
}))

const makePort = tanstackBalancesPort

const encodeTokenAccount = (args: {
  mint: PublicKey
  owner: PublicKey
  amount: bigint
  state: AccountState
}): Buffer => {
  const data = Buffer.alloc(AccountLayout.span)
  AccountLayout.encode(
    {
      mint: args.mint,
      owner: args.owner,
      amount: args.amount,
      delegateOption: 0,
      delegate: PublicKey.default,
      delegatedAmount: BigInt(0),
      state: args.state,
      isNativeOption: 0,
      isNative: BigInt(0),
      closeAuthorityOption: 0,
      closeAuthority: PublicKey.default,
    },
    data,
  )
  return data
}

const encodeMint = (decimals: number): Buffer => {
  const data = Buffer.alloc(MintLayout.span)
  MintLayout.encode(
    {
      mintAuthorityOption: 0,
      mintAuthority: PublicKey.default,
      supply: BigInt(0),
      decimals,
      isInitialized: true,
      freezeAuthorityOption: 0,
      freezeAuthority: PublicKey.default,
    },
    data,
  )
  return data
}

const accountInfo = (data: Buffer, lamports = 0): AccountInfo<Buffer> => ({
  data,
  lamports,
  owner: TOKEN_PROGRAM_ID,
  executable: false,
  rentEpoch: 0,
})

type Holding = {
  mint: PublicKey
  amount: bigint
  state?: AccountState
}

// An RPC connection holding one wallet's token accounts, its lamports, and the
// mints' decimals. A mint absent from `decimalsByMint` has no account on chain,
// and `lamports: null` is a wallet with no account, which getBalance reads as 0.
const fakeConnection = (args: {
  owner: PublicKey
  lamports: number | null
  holdings: Holding[]
  decimalsByMint: Record<string, number>
  mintFetchError?: Error
}) => {
  const tokenAccounts = args.holdings.map((holding) => ({
    pubkey: Keypair.generate().publicKey,
    account: accountInfo(
      encodeTokenAccount({
        mint: holding.mint,
        owner: args.owner,
        amount: holding.amount,
        state: holding.state ?? AccountState.Initialized,
      }),
    ),
  }))
  const connection = {
    getTokenAccountsByOwner: jest.fn(async () => ({
      context: { slot: 1 },
      value: tokenAccounts,
    })),
    getBalance: jest.fn(async () => args.lamports ?? 0),
    getMultipleAccountsInfo: jest.fn(async (mints: PublicKey[]) => {
      if (args.mintFetchError) throw args.mintFetchError
      return mints.map((mint) => {
        const decimals = args.decimalsByMint[mint.toBase58()]
        return decimals === undefined ? null : accountInfo(encodeMint(decimals))
      })
    }),
  }
  return {
    connection,
    tokenAccounts: tokenAccounts.map(({ pubkey }) => pubkey.toBase58()),
  }
}

const providerFor = (connection: unknown) =>
  ({ connection }) as unknown as AnchorProvider

const accountFor = (owner: PublicKey) =>
  ({ solanaAddress: owner.toBase58() }) as CSAccount

// The sync guard is module state: one sync in flight across all wallets, the
// syncs of other wallets waiting their turn, and a 5s cooldown on the
// last-synced cluster+wallet key. Each test starts a minute after the last so
// no cooldown carries over.
let now = 0
beforeEach(() => {
  now += 60_000
  jest.spyOn(Date, 'now').mockImplementation(() => now)
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
  clearBalancesPorts()
})

describe('syncTokenAccounts', () => {
  it("stores the wallet's token accounts with mint decimals and its SOL balance", async () => {
    const owner = Keypair.generate().publicKey
    const { connection, tokenAccounts } = fakeConnection({
      owner,
      lamports: 2_000_000_000,
      holdings: [
        { mint: HNT_MINT, amount: BigInt(12345678) },
        { mint: DC_MINT, amount: BigInt(5000), state: AccountState.Frozen },
      ],
      decimalsByMint: {
        [HNT_MINT.toBase58()]: 8,
        [DC_MINT.toBase58()]: 0,
      },
    })
    const port = makePort()

    await port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(owner),
      anchorProvider: providerFor(connection),
    })

    expect(connection.getTokenAccountsByOwner).toHaveBeenCalledWith(owner, {
      programId: TOKEN_PROGRAM_ID,
    })
    expect(connection.getBalance).toHaveBeenCalledWith(owner)
    expect(port.isSyncing()).toBe(false)
    expect(port.tokensOf('mainnet-beta', owner.toBase58())).toEqual({
      atas: [
        {
          tokenAccount: tokenAccounts[0],
          mint: HNT_MINT.toBase58(),
          balance: 12345678,
          decimals: 8,
          frozen: false,
        },
        {
          tokenAccount: tokenAccounts[1],
          mint: DC_MINT.toBase58(),
          balance: 5000,
          decimals: 0,
          frozen: true,
        },
      ],
      sol: { tokenAccount: owner.toBase58(), balance: 2_000_000_000 },
    })
  })

  it('marks balances as loading while a sync is in flight', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: 0,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()

    const pending = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(owner),
      anchorProvider: providerFor(connection),
    })

    expect(port.isSyncing()).toBe(true)
    await pending
    expect(port.isSyncing()).toBe(false)
  })

  it('rejects a sync whose mint fetch fails and stores nothing', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: 0,
      holdings: [{ mint: HNT_MINT, amount: BigInt(100) }],
      decimalsByMint: { [HNT_MINT.toBase58()]: 8 },
      mintFetchError: new Error('rpc down'),
    })
    const port = makePort()

    const sync = await port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(owner),
      anchorProvider: providerFor(connection),
    })

    expect(sync).toBe('rejected')
    expect(port.tokensOf('mainnet-beta', owner.toBase58())).toBeUndefined()
  })

  it('keeps the stored mint decimals when a later mint fetch fails', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: 0,
      holdings: [{ mint: HNT_MINT, amount: BigInt(100) }],
      decimalsByMint: { [HNT_MINT.toBase58()]: 8 },
    })
    const port = makePort()
    const sync = () =>
      port.syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(owner),
        anchorProvider: providerFor(connection),
      })

    expect(await sync()).toBe('fulfilled')
    now += 5_000
    connection.getMultipleAccountsInfo.mockRejectedValueOnce(
      new Error('rpc down'),
    )

    expect(await sync()).toBe('rejected')
    const tokens = port.tokensOf('mainnet-beta', owner.toBase58())
    expect(
      tokens?.atas.map(({ mint, decimals }) => ({ mint, decimals })),
    ).toEqual([{ mint: HNT_MINT.toBase58(), decimals: 8 }])
  })

  it('rejects a sync whose mint has no account and stores nothing', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: 0,
      holdings: [{ mint: HNT_MINT, amount: BigInt(100) }],
      decimalsByMint: {},
    })
    const port = makePort()

    const sync = await port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(owner),
      anchorProvider: providerFor(connection),
    })

    expect(sync).toBe('rejected')
    expect(port.tokensOf('mainnet-beta', owner.toBase58())).toBeUndefined()
  })

  it('reads SOL as 0 for a wallet with no account', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: null,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()

    await port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(owner),
      anchorProvider: providerFor(connection),
    })

    const tokens = port.tokensOf('mainnet-beta', owner.toBase58())
    expect(tokens?.sol).toEqual({ tokenAccount: owner.toBase58(), balance: 0 })
  })

  it('fetches mints at most 100 per RPC request', async () => {
    const owner = Keypair.generate().publicKey
    const mints = Array.from(
      { length: 101 },
      () => Keypair.generate().publicKey,
    )
    const { connection } = fakeConnection({
      owner,
      lamports: 0,
      holdings: mints.map((mint) => ({ mint, amount: BigInt(1) })),
      decimalsByMint: Object.fromEntries(mints.map((m) => [m.toBase58(), 6])),
    })
    const port = makePort()

    await port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(owner),
      anchorProvider: providerFor(connection),
    })

    expect(
      connection.getMultipleAccountsInfo.mock.calls.map(
        ([batch]) => batch.length,
      ),
    ).toEqual([100, 1])
    const tokens = port.tokensOf('mainnet-beta', owner.toBase58())
    expect(tokens?.atas.every(({ decimals }) => decimals === 6)).toBe(true)
  })

  it('rejects a second sync of the same wallet within 5 seconds and keeps the stored balances', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: 1000,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()
    const sync = () =>
      port.syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(owner),
        anchorProvider: providerFor(connection),
      })

    await sync()
    now += 4_999
    const second = await sync()

    expect(second).toBe('rejected')
    expect(port.isSyncing()).toBe(false)
    expect(port.tokensOf('mainnet-beta', owner.toBase58())?.sol).toEqual({
      tokenAccount: owner.toBase58(),
      balance: 1000,
    })

    now += 1
    const third = await sync()

    expect(third).toBe('fulfilled')
    expect(connection.getTokenAccountsByOwner).toHaveBeenCalledTimes(2)
  })

  // A connection whose token account read waits until `release` is called
  const hangingConnection = (
    connection: ReturnType<typeof fakeConnection>['connection'],
  ) => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const getTokenAccounts = connection.getTokenAccountsByOwner
    return {
      release,
      connection: {
        ...connection,
        getTokenAccountsByOwner: jest.fn(async () => {
          await gate
          return getTokenAccounts()
        }),
      },
    }
  }

  it('queues a sync of another wallet while one is in flight and runs it when that one ends', async () => {
    const ownerA = Keypair.generate().publicKey
    const ownerB = Keypair.generate().publicKey
    const a = hangingConnection(
      fakeConnection({
        owner: ownerA,
        lamports: 1000,
        holdings: [],
        decimalsByMint: {},
      }).connection,
    )
    const b = fakeConnection({
      owner: ownerB,
      lamports: 2000,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()

    const syncA = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerA),
      anchorProvider: providerFor(a.connection),
    })
    const syncB = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerB),
      anchorProvider: providerFor(b.connection),
    })
    await Promise.resolve()

    expect(b.connection.getTokenAccountsByOwner).not.toHaveBeenCalled()
    expect(port.tokensOf('mainnet-beta', ownerB.toBase58())).toBeUndefined()

    a.release()

    expect(await syncA).toBe('fulfilled')
    expect(await syncB).toBe('fulfilled')
    expect(port.tokensOf('mainnet-beta', ownerA.toBase58())?.sol).toEqual({
      tokenAccount: ownerA.toBase58(),
      balance: 1000,
    })
    expect(port.tokensOf('mainnet-beta', ownerB.toBase58())?.sol).toEqual({
      tokenAccount: ownerB.toBase58(),
      balance: 2000,
    })
    expect(port.isSyncing()).toBe(false)
  })

  it('collapses repeat syncs of a waiting wallet into one', async () => {
    const ownerA = Keypair.generate().publicKey
    const ownerB = Keypair.generate().publicKey
    const a = hangingConnection(
      fakeConnection({
        owner: ownerA,
        lamports: 1000,
        holdings: [],
        decimalsByMint: {},
      }).connection,
    )
    const b = fakeConnection({
      owner: ownerB,
      lamports: 2000,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()
    const syncB = () =>
      port.syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(ownerB),
        anchorProvider: providerFor(b.connection),
      })

    const syncA = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerA),
      anchorProvider: providerFor(a.connection),
    })
    const firstB = syncB()
    const secondB = syncB()
    a.release()

    expect(await Promise.all([syncA, firstB, secondB])).toEqual([
      'fulfilled',
      'fulfilled',
      'fulfilled',
    ])
    expect(b.connection.getTokenAccountsByOwner).toHaveBeenCalledTimes(1)
  })

  it('rejects a sync of the wallet in flight and fetches it once', async () => {
    const owner = Keypair.generate().publicKey
    const a = hangingConnection(
      fakeConnection({
        owner,
        lamports: 1000,
        holdings: [],
        decimalsByMint: {},
      }).connection,
    )
    const port = makePort()
    const sync = () =>
      port.syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(owner),
        anchorProvider: providerFor(a.connection),
      })

    const first = sync()
    const second = await sync()

    expect(second).toBe('rejected')

    a.release()

    expect(await first).toBe('fulfilled')
    expect(a.connection.getTokenAccountsByOwner).toHaveBeenCalledTimes(1)
  })

  it('times out a hung sync, runs the waiting one, and syncs the hung wallet again', async () => {
    // Date stays on the test clock above
    jest.useFakeTimers({ doNotFake: ['Date'] })
    const ownerA = Keypair.generate().publicKey
    const ownerB = Keypair.generate().publicKey
    const fakeA = () =>
      fakeConnection({
        owner: ownerA,
        lamports: 1000,
        holdings: [],
        decimalsByMint: {},
      }).connection
    // Never released: the token account read hangs, as with no fetch timeout
    const hungA = hangingConnection(fakeA())
    const b = fakeConnection({
      owner: ownerB,
      lamports: 2000,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()

    const syncA = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerA),
      anchorProvider: providerFor(hungA.connection),
    })
    const syncB = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerB),
      anchorProvider: providerFor(b.connection),
    })
    await jest.advanceTimersByTimeAsync(TOKEN_SYNC_TIMEOUT)

    // The pull-to-refresh spinner ends when its sync settles
    expect(await syncA).toBe('rejected')
    expect(await syncB).toBe('fulfilled')
    expect(port.tokensOf('mainnet-beta', ownerB.toBase58())?.sol).toEqual({
      tokenAccount: ownerB.toBase58(),
      balance: 2000,
    })
    expect(port.isSyncing()).toBe(false)

    // The next sync of the hung wallet asks the RPC again
    now += 5_000
    const retryA = fakeA()
    const retry = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerA),
      anchorProvider: providerFor(retryA),
    })
    await jest.advanceTimersByTimeAsync(0)

    expect(await retry).toBe('fulfilled')
    expect(retryA.getTokenAccountsByOwner).toHaveBeenCalledTimes(1)
    expect(port.tokensOf('mainnet-beta', ownerA.toBase58())?.sol).toEqual({
      tokenAccount: ownerA.toBase58(),
      balance: 1000,
    })
  })

  it('runs a waiting sync when the sync before it fails', async () => {
    const ownerA = Keypair.generate().publicKey
    const ownerB = Keypair.generate().publicKey
    const a = hangingConnection(
      fakeConnection({
        owner: ownerA,
        lamports: 1000,
        holdings: [],
        decimalsByMint: {},
      }).connection,
    )
    const failingA = {
      ...a.connection,
      getBalance: jest.fn(async () => {
        throw new Error('rpc down')
      }),
    }
    const b = fakeConnection({
      owner: ownerB,
      lamports: 2000,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()

    const syncA = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerA),
      anchorProvider: providerFor(failingA),
    })
    const syncB = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerB),
      anchorProvider: providerFor(b.connection),
    })
    a.release()

    expect(await syncA).toBe('rejected')
    expect(await syncB).toBe('fulfilled')
    expect(port.tokensOf('mainnet-beta', ownerB.toBase58())?.sol).toEqual({
      tokenAccount: ownerB.toBase58(),
      balance: 2000,
    })
  })

  it('runs two waiting syncs one after the other', async () => {
    const ownerA = Keypair.generate().publicKey
    const ownerB = Keypair.generate().publicKey
    const ownerC = Keypair.generate().publicKey
    const a = hangingConnection(
      fakeConnection({
        owner: ownerA,
        lamports: 1000,
        holdings: [],
        decimalsByMint: {},
      }).connection,
    )
    const b = fakeConnection({
      owner: ownerB,
      lamports: 2000,
      holdings: [],
      decimalsByMint: {},
    })
    const c = fakeConnection({
      owner: ownerC,
      lamports: 3000,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()

    const syncA = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerA),
      anchorProvider: providerFor(a.connection),
    })
    const syncB = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerB),
      anchorProvider: providerFor(b.connection),
    })
    const syncC = port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerC),
      anchorProvider: providerFor(c.connection),
    })
    a.release()

    expect(await Promise.all([syncA, syncB, syncC])).toEqual([
      'fulfilled',
      'fulfilled',
      'fulfilled',
    ])
    expect(port.tokensOf('mainnet-beta', ownerC.toBase58())?.sol).toEqual({
      tokenAccount: ownerC.toBase58(),
      balance: 3000,
    })
  })

  // Drives syncTokenAccounts on its own client: the test needs that client's
  // in-flight fetch of A to act between A's end and B's start
  it('queues a sync requested after one sync ends and before the waiting one starts', async () => {
    const ownerA = Keypair.generate().publicKey
    const ownerB = Keypair.generate().publicKey
    const ownerC = Keypair.generate().publicKey
    const a = hangingConnection(
      fakeConnection({
        owner: ownerA,
        lamports: 1000,
        holdings: [],
        decimalsByMint: {},
      }).connection,
    )
    const b = fakeConnection({
      owner: ownerB,
      lamports: 2000,
      holdings: [],
      decimalsByMint: {},
    })
    const c = fakeConnection({
      owner: ownerC,
      lamports: 3000,
      holdings: [],
      decimalsByMint: {},
    })
    const client = createQueryClient()
    const outcomeOf = (read: Promise<unknown>) =>
      read.then(
        () => 'fulfilled',
        () => 'rejected',
      )
    const solOf = (owner: PublicKey) =>
      client.getQueryData(
        tokenAccountsQueryOptions({
          cluster: 'mainnet-beta',
          solanaAddress: owner.toBase58(),
          anchorProvider: undefined,
        }).queryKey,
      )?.sol
    const started: Promise<unknown>[] = []

    try {
      const syncA = outcomeOf(
        syncTokenAccounts(client, {
          cluster: 'mainnet-beta',
          acct: accountFor(ownerA),
          anchorProvider: providerFor(a.connection),
        }),
      )
      const syncB = outcomeOf(
        syncTokenAccounts(client, {
          cluster: 'mainnet-beta',
          acct: accountFor(ownerB),
          anchorProvider: providerFor(b.connection),
        }),
      )
      // Shares A's in-flight fetch and settles after A's sync ends, before B's
      // queued sync starts
      const syncC = client
        .fetchQuery({
          ...tokenAccountsQueryOptions({
            cluster: 'mainnet-beta',
            solanaAddress: ownerA.toBase58(),
            anchorProvider: providerFor(a.connection),
          }),
          staleTime: 0,
        })
        .then(() =>
          outcomeOf(
            syncTokenAccounts(client, {
              cluster: 'mainnet-beta',
              acct: accountFor(ownerC),
              anchorProvider: providerFor(c.connection),
            }),
          ),
        )
      started.push(syncA, syncB, syncC)
      a.release()

      expect(await Promise.all([syncA, syncB, syncC])).toEqual([
        'fulfilled',
        'fulfilled',
        'fulfilled',
      ])
      expect(solOf(ownerB)).toEqual({
        tokenAccount: ownerB.toBase58(),
        balance: 2000,
      })
      expect(solOf(ownerC)).toEqual({
        tokenAccount: ownerC.toBase58(),
        balance: 3000,
      })
    } finally {
      // Clearing the client under a queued sync keeps jest from exiting
      await Promise.allSettled(started)
      client.clear()
    }
  })

  it('syncs a wallet again within 5 seconds when another wallet synced in between', async () => {
    const ownerA = Keypair.generate().publicKey
    const ownerB = Keypair.generate().publicKey
    const a = fakeConnection({
      owner: ownerA,
      lamports: 1000,
      holdings: [],
      decimalsByMint: {},
    })
    const b = fakeConnection({
      owner: ownerB,
      lamports: 2000,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()
    const syncA = () =>
      port.syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(ownerA),
        anchorProvider: providerFor(a.connection),
      })

    await syncA()
    now += 1_000
    await port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(ownerB),
      anchorProvider: providerFor(b.connection),
    })
    now += 1_000
    const third = await syncA()

    expect(third).toBe('fulfilled')
    expect(a.connection.getTokenAccountsByOwner).toHaveBeenCalledTimes(2)
  })

  it('syncs the same wallet on another cluster within 5 seconds', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: 1000,
      holdings: [],
      decimalsByMint: {},
    })
    const port = makePort()
    const syncOn = (cluster: 'mainnet-beta' | 'devnet') =>
      port.syncTokenAccounts({
        cluster,
        acct: accountFor(owner),
        anchorProvider: providerFor(connection),
      })

    await syncOn('mainnet-beta')
    now += 1_000
    const devnet = await syncOn('devnet')

    expect(devnet).toBe('fulfilled')
    expect(port.tokensOf('devnet', owner.toBase58())?.sol).toEqual({
      tokenAccount: owner.toBase58(),
      balance: 1000,
    })
  })

  describe('through the account cache the app wraps its connection with', () => {
    const CACHE_DELAY = 10
    const caches: AccountFetchCache[] = []

    beforeEach(() => {
      // Date stays on the test clock above
      jest.useFakeTimers({ doNotFake: ['Date'] })
    })

    afterEach(() => {
      caches.splice(0).forEach((cache) => cache.close())
    })

    const rpcResult = (result: unknown) => ({ jsonrpc: '2.0', id: '1', result })

    // A real web3.js Connection, wrapped as SolanaProvider wraps it, whose RPC
    // holds one HNT account (8 decimals) and 1000 lamports per wallet and
    // fails every `failingMethod` request. Before the SOL balance read moved
    // to getBalance it went through the cache's getMultipleAccounts, so a
    // failing getBalance also fails that read of a wallet.
    const wrappedConnection = (
      failingMethod?: 'getMultipleAccounts' | 'getBalance',
    ) => {
      const connection = new Connection('http://localhost', 'confirmed')
      const rpcRequest = jest.fn(async (method: string, params: unknown[]) => {
        const [first] = params
        const keys = method === 'getMultipleAccounts' ? (first as string[]) : []
        const owner = method === 'getMultipleAccounts' ? undefined : first
        const readsWallet = keys.some((key) => key !== HNT_MINT.toBase58())
        if (
          method === failingMethod ||
          (failingMethod === 'getBalance' && readsWallet)
        ) {
          throw new Error(`rpc down: ${method}`)
        }
        const slot = { slot: 1 }
        if (method === 'getTokenAccountsByOwner') {
          const data = encodeTokenAccount({
            mint: HNT_MINT,
            owner: new PublicKey(owner as string),
            amount: BigInt(100),
            state: AccountState.Initialized,
          })
          return rpcResult({
            context: slot,
            value: [
              {
                pubkey: Keypair.generate().publicKey.toBase58(),
                account: {
                  data: [data.toString('base64'), 'base64'],
                  executable: false,
                  lamports: 1,
                  owner: TOKEN_PROGRAM_ID.toBase58(),
                  rentEpoch: 0,
                },
              },
            ],
          })
        }
        if (method === 'getBalance') {
          return rpcResult({ context: slot, value: 1000 })
        }
        if (method === 'getMultipleAccounts') {
          return rpcResult({
            context: slot,
            value: keys.map((key) =>
              key === HNT_MINT.toBase58()
                ? {
                    data: [encodeMint(8).toString('base64'), 'base64'],
                    executable: false,
                    lamports: 1,
                    owner: TOKEN_PROGRAM_ID.toBase58(),
                    rentEpoch: 0,
                  }
                : {
                    data: ['', 'base64'],
                    executable: false,
                    lamports: 1000,
                    owner: SystemProgram.programId.toBase58(),
                    rentEpoch: 0,
                  },
            ),
          })
        }
        throw new Error(`unexpected RPC method ${method}`)
      })
      // The cache watches each account it fetches; no websocket in a unit test
      Object.assign(connection, {
        _rpcRequest: rpcRequest,
        onAccountChange: jest.fn(() => 1),
        removeAccountChangeListener: jest.fn(async () => {}),
      })
      caches.push(
        new AccountFetchCache({
          connection,
          delay: CACHE_DELAY,
          commitment: 'confirmed',
          missingRefetchDelay: 60_000,
          extendConnection: true,
        }),
      )
      return { connection, rpcRequest }
    }

    // Each RPC read through the cache waits one batch delay
    const settle = (sync: Promise<unknown>) =>
      jest.advanceTimersByTimeAsync(CACHE_DELAY * 10).then(() => sync)

    // The mint read skips the cache, so a failed batch the cache stores as
    // null does not fail the next sync
    it('syncs the mint decimals once the RPC recovers from a failed mint read', async () => {
      const owner = Keypair.generate().publicKey
      const port = makePort()
      const { connection, rpcRequest } = wrappedConnection()
      const answer = rpcRequest.getMockImplementation()
      if (!answer) throw new Error('rpcRequest has no implementation')
      rpcRequest.mockImplementation(async (method, params) => {
        if (method === 'getMultipleAccounts') throw new Error('rpc down')
        return answer(method, params)
      })
      const sync = () =>
        settle(
          port.syncTokenAccounts({
            cluster: 'mainnet-beta',
            acct: accountFor(owner),
            anchorProvider: providerFor(connection),
          }),
        )

      expect(await sync()).toBe('rejected')
      expect(port.tokensOf('mainnet-beta', owner.toBase58())).toBeUndefined()

      rpcRequest.mockImplementation(answer)
      now += 5_000
      await jest.advanceTimersByTimeAsync(5_000)

      expect(await sync()).toBe('fulfilled')
      expect(
        port
          .tokensOf('mainnet-beta', owner.toBase58())
          ?.atas.map(({ mint, decimals }) => ({ mint, decimals })),
      ).toEqual([{ mint: HNT_MINT.toBase58(), decimals: 8 }])
    })

    // A cache batch that never settles holds every later read through the
    // cache, so the mint read must not wait on it
    it('syncs while an unrelated cache read never settles', async () => {
      const owner = Keypair.generate().publicKey
      const unrelated = Keypair.generate().publicKey
      const port = makePort()
      const { connection, rpcRequest } = wrappedConnection()
      const answer = rpcRequest.getMockImplementation()
      if (!answer) throw new Error('rpcRequest has no implementation')
      rpcRequest.mockImplementation((method, params) => {
        const [keys] = params
        if (
          method === 'getMultipleAccounts' &&
          (keys as string[]).includes(unrelated.toBase58())
        ) {
          return new Promise(() => {})
        }
        return answer(method, params)
      })
      void connection.getAccountInfo(unrelated)
      await jest.advanceTimersByTimeAsync(CACHE_DELAY * 10)
      expect(rpcRequest).toHaveBeenCalledWith(
        'getMultipleAccounts',
        expect.arrayContaining([[unrelated.toBase58()]]),
      )

      const sync = port.syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(owner),
        anchorProvider: providerFor(connection),
      })
      await jest.advanceTimersByTimeAsync(TOKEN_SYNC_TIMEOUT)

      expect(await sync).toBe('fulfilled')
      expect(port.tokensOf('mainnet-beta', owner.toBase58())?.atas).toEqual([
        expect.objectContaining({ mint: HNT_MINT.toBase58(), decimals: 8 }),
      ])
    })

    it.each(['getMultipleAccounts', 'getBalance'] as const)(
      'rejects a sync whose %s request fails and keeps the stored balances',
      async (failingMethod) => {
        const seeded = Keypair.generate().publicKey
        const unsynced = Keypair.generate().publicKey
        const port = makePort()
        // Its own cache, so the failing sync below finds nothing cached
        const seed = wrappedConnection()
        expect(
          await settle(
            port.syncTokenAccounts({
              cluster: 'mainnet-beta',
              acct: accountFor(seeded),
              anchorProvider: providerFor(seed.connection),
            }),
          ),
        ).toBe('fulfilled')
        const stored = port.tokensOf('mainnet-beta', seeded.toBase58())
        expect(stored?.atas[0].decimals).toBe(8)
        expect(stored?.sol.balance).toBe(1000)
        now += 5_000
        const { connection, rpcRequest } = wrappedConnection(failingMethod)

        const syncOf = (owner: PublicKey) =>
          settle(
            port.syncTokenAccounts({
              cluster: 'mainnet-beta',
              acct: accountFor(owner),
              anchorProvider: providerFor(connection),
            }),
          )

        expect(await syncOf(seeded)).toBe('rejected')
        expect(await syncOf(unsynced)).toBe('rejected')
        expect(rpcRequest.mock.calls.map(([method]) => method)).toContain(
          failingMethod,
        )
        expect(port.tokensOf('mainnet-beta', seeded.toBase58())).toEqual(stored)
        expect(
          port.tokensOf('mainnet-beta', unsynced.toBase58()),
        ).toBeUndefined()
      },
    )
  })

  it('rejects a wallet with no Solana address and stores nothing', async () => {
    const port = makePort()
    const { connection } = fakeConnection({
      owner: Keypair.generate().publicKey,
      lamports: 0,
      holdings: [],
      decimalsByMint: {},
    })

    const result = await port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: {} as CSAccount,
      anchorProvider: providerFor(connection),
    })

    expect(result).toBe('rejected')
    expect(port.walletsOn('mainnet-beta')).toEqual({})
  })
})

describe('balance updates', () => {
  const syncedPort = async () => {
    const owner = Keypair.generate().publicKey
    const { connection, tokenAccounts } = fakeConnection({
      owner,
      lamports: 1000,
      holdings: [{ mint: HNT_MINT, amount: BigInt(100) }],
      decimalsByMint: { [HNT_MINT.toBase58()]: 8 },
    })
    const port = makePort()
    await port.syncTokenAccounts({
      cluster: 'mainnet-beta',
      acct: accountFor(owner),
      anchorProvider: providerFor(connection),
    })
    return { port, owner: owner.toBase58(), hntAccount: tokenAccounts[0] }
  }

  const tokensOf = (port: BalancesPort, owner: string) =>
    port.tokensOf('mainnet-beta', owner)

  it('replaces the SOL balance of a synced wallet', async () => {
    const { port, owner } = await syncedPort()

    port.updateSolBalance({
      cluster: 'mainnet-beta',
      solanaAddress: owner,
      balance: 2500,
      tokenAccount: owner,
    })

    expect(tokensOf(port, owner)?.sol).toEqual({
      tokenAccount: owner,
      balance: 2500,
    })
  })

  it('ignores a SOL balance for a wallet that has not synced', () => {
    const port = makePort()
    const owner = Keypair.generate().publicKey.toBase58()

    port.updateSolBalance({
      cluster: 'mainnet-beta',
      solanaAddress: owner,
      balance: 2500,
      tokenAccount: owner,
    })

    expect(tokensOf(port, owner)).toBeUndefined()
  })

  it('replaces the balance of the token account matching both account and mint', async () => {
    const { port, owner, hntAccount } = await syncedPort()

    port.updateTokenBalance({
      cluster: 'mainnet-beta',
      solanaAddress: owner,
      balance: 777,
      mint: HNT_MINT.toBase58(),
      tokenAccount: hntAccount,
    })

    expect(tokensOf(port, owner)?.atas[0].balance).toBe(777)
  })

  it('ignores a token balance whose mint does not match the account', async () => {
    const { port, owner, hntAccount } = await syncedPort()

    port.updateTokenBalance({
      cluster: 'mainnet-beta',
      solanaAddress: owner,
      balance: 777,
      mint: DC_MINT.toBase58(),
      tokenAccount: hntAccount,
    })

    expect(tokensOf(port, owner)?.atas).toEqual([
      {
        tokenAccount: hntAccount,
        mint: HNT_MINT.toBase58(),
        balance: 100,
        decimals: 8,
        frozen: false,
      },
    ])
  })

  it('clears every wallet on purge', async () => {
    const { port, owner } = await syncedPort()
    jest.mocked(getBalanceHistory).mockResolvedValueOnce([])
    await port.readBalanceHistory({
      currency: 'usd',
      cluster: 'mainnet-beta',
      solanaAddress: owner,
    })

    port.purge()

    expect(
      (['mainnet-beta', 'devnet', 'testnet'] as const).map(port.walletsOn),
    ).toEqual([{}, {}, {}])
    expect(port.balanceHistoryOf('mainnet-beta', owner)).toBeUndefined()
  })
})

describe('readTokenPrices', () => {
  it('stores only the requested currency for each token', async () => {
    jest.mocked(getTokenPrices).mockResolvedValueOnce({
      helium: { usd: 2.5, eur: 2.3 },
      solana: { usd: 150, eur: 140 },
      'helium-iot': { usd: 0.0004, eur: 0.0003 },
      'helium-mobile': { usd: 0.0002, eur: 0.0001 },
    })
    const port = makePort()

    await port.readTokenPrices('usd')

    expect(getTokenPrices).toHaveBeenCalledWith('usd')
    expect(port.tokenPrices()).toEqual({
      helium: { usd: 2.5 },
      solana: { usd: 150 },
      'helium-iot': { usd: 0.0004 },
      'helium-mobile': { usd: 0.0002 },
    })
  })

  it('keeps prices already read in another currency', async () => {
    jest
      .mocked(getTokenPrices)
      .mockResolvedValueOnce({
        helium: { usd: 2.5 },
        solana: { usd: 150 },
        'helium-iot': { usd: 0.0004 },
        'helium-mobile': { usd: 0.0002 },
      })
      .mockResolvedValueOnce({
        helium: { eur: 2.3 },
        solana: { eur: 140 },
        'helium-iot': { eur: 0.0003 },
        'helium-mobile': { eur: 0.0001 },
      })
    const port = makePort()

    await port.readTokenPrices('usd')
    await port.readTokenPrices('eur')

    expect(port.tokenPrices()).toEqual({
      helium: { usd: 2.5, eur: 2.3 },
      solana: { usd: 150, eur: 140 },
      'helium-iot': { usd: 0.0004, eur: 0.0003 },
      'helium-mobile': { usd: 0.0002, eur: 0.0001 },
    })
  })

  it('keeps the last prices when a read fails', async () => {
    jest
      .mocked(getTokenPrices)
      .mockResolvedValueOnce({
        helium: { usd: 2.5 },
        solana: { usd: 150 },
        'helium-iot': { usd: 0.0004 },
        'helium-mobile': { usd: 0.0002 },
      })
      .mockRejectedValueOnce(new Error('network'))
    const port = makePort()

    await port.readTokenPrices('usd')
    await port.readTokenPrices('usd')

    expect(port.tokenPrices()?.helium).toEqual({ usd: 2.5 })
  })
})

describe('readBalanceHistory', () => {
  it('stores the history per cluster, wallet and currency', async () => {
    const history: AccountBalance[] = [
      {
        hntBalance: 10,
        iotBalance: 20,
        mobileBalance: 30,
        date: '2026-10-01',
        hntPrice: 2.5,
        balance: 25,
      },
    ]
    const eurHistory: AccountBalance[] = [{ ...history[0], balance: 23 }]
    jest
      .mocked(getBalanceHistory)
      .mockResolvedValueOnce(history)
      .mockResolvedValueOnce(eurHistory)
    const port = makePort()
    const owner = Keypair.generate().publicKey.toBase58()

    await port.readBalanceHistory({
      currency: 'usd',
      cluster: 'devnet',
      solanaAddress: owner,
    })
    await port.readBalanceHistory({
      currency: 'eur',
      cluster: 'devnet',
      solanaAddress: owner,
    })

    expect(getBalanceHistory).toHaveBeenCalledWith({
      currency: 'usd',
      cluster: 'devnet',
      solanaAddress: owner,
    })
    expect(port.balanceHistoryOf('devnet', owner)).toEqual({
      usd: history,
      eur: eurHistory,
    })
  })
})
