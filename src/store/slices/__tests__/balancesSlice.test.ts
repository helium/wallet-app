import { AnchorProvider } from '@anchor-lang/core'
import { configureStore } from '@reduxjs/toolkit'
import {
  AccountLayout,
  AccountState,
  MintLayout,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { AccountInfo, Keypair, PublicKey } from '@solana/web3.js'
import { PURGE } from 'redux-persist'
import { CSAccount } from '../../../storage/cloudStorage'
import { AccountBalance } from '../../../types/balance'
import { getBalanceHistory, getTokenPrices } from '../../../utils/walletApiV2'
import reducer, {
  balancesSlice,
  readBalanceHistory,
  readTokenPrices,
  syncTokenAccounts,
} from '../balancesSlice'

jest.mock('../../../utils/walletApiV2', () => ({
  getTokenPrices: jest.fn(),
  getBalanceHistory: jest.fn(),
}))

const HNT_MINT = new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux')
const DC_MINT = new PublicKey('dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm')

const makeStore = () => configureStore({ reducer: { balances: reducer } })

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
// mints' decimals. A mint absent from `decimalsByMint` has no account on chain.
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
    getAccountInfo: jest.fn(async () =>
      args.lamports === null
        ? null
        : accountInfo(Buffer.alloc(0), args.lamports),
    ),
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
  ({ connection } as unknown as AnchorProvider)

const accountFor = (owner: PublicKey) =>
  ({ solanaAddress: owner.toBase58() } as CSAccount)

// The sync guard is module state with a 5s cooldown per wallet. Each test
// starts a minute after the last so no cooldown carries over.
let now = 0
beforeEach(() => {
  now += 60_000
  jest.spyOn(Date, 'now').mockImplementation(() => now)
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
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
    const store = makeStore()

    await store.dispatch(
      syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(owner),
        anchorProvider: providerFor(connection),
      }),
    )

    const { balances } = store.getState()
    expect(balances.balancesLoading).toBe(false)
    expect(balances.balances['mainnet-beta'][owner.toBase58()]).toEqual({
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
  it('reads decimals as 0 when the mint fetch fails', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: 0,
      holdings: [{ mint: HNT_MINT, amount: BigInt(100) }],
      decimalsByMint: { [HNT_MINT.toBase58()]: 8 },
      mintFetchError: new Error('rpc down'),
    })
    const store = makeStore()

    await store.dispatch(
      syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(owner),
        anchorProvider: providerFor(connection),
      }),
    )

    const tokens =
      store.getState().balances.balances['mainnet-beta'][owner.toBase58()]
    expect(
      tokens.atas.map(({ mint, decimals }) => ({ mint, decimals })),
    ).toEqual([{ mint: HNT_MINT.toBase58(), decimals: 0 }])
  })

  it('reads decimals as 0 for a mint with no account, and SOL as 0 for a wallet with no account', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: null,
      holdings: [{ mint: HNT_MINT, amount: BigInt(100) }],
      decimalsByMint: {},
    })
    const store = makeStore()

    await store.dispatch(
      syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(owner),
        anchorProvider: providerFor(connection),
      }),
    )

    const tokens =
      store.getState().balances.balances['mainnet-beta'][owner.toBase58()]
    expect(tokens.atas[0].decimals).toBe(0)
    expect(tokens.sol).toEqual({ tokenAccount: owner.toBase58(), balance: 0 })
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
    const store = makeStore()

    await store.dispatch(
      syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(owner),
        anchorProvider: providerFor(connection),
      }),
    )

    expect(
      connection.getMultipleAccountsInfo.mock.calls.map(
        ([batch]) => batch.length,
      ),
    ).toEqual([100, 1])
    const tokens =
      store.getState().balances.balances['mainnet-beta'][owner.toBase58()]
    expect(tokens.atas.every(({ decimals }) => decimals === 6)).toBe(true)
  })

  it('rejects a second sync of the same wallet within 5 seconds and keeps the stored balances', async () => {
    const owner = Keypair.generate().publicKey
    const { connection } = fakeConnection({
      owner,
      lamports: 1000,
      holdings: [],
      decimalsByMint: {},
    })
    const store = makeStore()
    const sync = () =>
      store.dispatch(
        syncTokenAccounts({
          cluster: 'mainnet-beta',
          acct: accountFor(owner),
          anchorProvider: providerFor(connection),
        }),
      )

    await sync()
    now += 4_999
    const second = await sync()

    expect(second.meta.requestStatus).toBe('rejected')
    expect(store.getState().balances.balancesLoading).toBe(false)
    expect(
      store.getState().balances.balances['mainnet-beta'][owner.toBase58()].sol,
    ).toEqual({ tokenAccount: owner.toBase58(), balance: 1000 })

    now += 1
    const third = await sync()

    expect(third.meta.requestStatus).toBe('fulfilled')
    expect(connection.getTokenAccountsByOwner).toHaveBeenCalledTimes(2)
  })

  it('rejects a wallet with no Solana address and stores nothing', async () => {
    const store = makeStore()
    const { connection } = fakeConnection({
      owner: Keypair.generate().publicKey,
      lamports: 0,
      holdings: [],
      decimalsByMint: {},
    })

    const result = await store.dispatch(
      syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: {} as CSAccount,
        anchorProvider: providerFor(connection),
      }),
    )

    expect(result.meta.requestStatus).toBe('rejected')
    expect(store.getState().balances.balances['mainnet-beta']).toEqual({})
  })
})

describe('balance updates', () => {
  const syncedStore = async () => {
    const owner = Keypair.generate().publicKey
    const { connection, tokenAccounts } = fakeConnection({
      owner,
      lamports: 1000,
      holdings: [{ mint: HNT_MINT, amount: BigInt(100) }],
      decimalsByMint: { [HNT_MINT.toBase58()]: 8 },
    })
    const store = makeStore()
    await store.dispatch(
      syncTokenAccounts({
        cluster: 'mainnet-beta',
        acct: accountFor(owner),
        anchorProvider: providerFor(connection),
      }),
    )
    return { store, owner: owner.toBase58(), hntAccount: tokenAccounts[0] }
  }

  const tokensOf = (store: ReturnType<typeof makeStore>, owner: string) =>
    store.getState().balances.balances['mainnet-beta'][owner]

  it('replaces the SOL balance of a synced wallet', async () => {
    const { store, owner } = await syncedStore()

    store.dispatch(
      balancesSlice.actions.updateBalance({
        cluster: 'mainnet-beta',
        solanaAddress: owner,
        balance: 2500,
        tokenAccount: owner,
      }),
    )

    expect(tokensOf(store, owner).sol).toEqual({
      tokenAccount: owner,
      balance: 2500,
    })
  })

  it('ignores a SOL balance for a wallet that has not synced', () => {
    const store = makeStore()
    const owner = Keypair.generate().publicKey.toBase58()

    store.dispatch(
      balancesSlice.actions.updateBalance({
        cluster: 'mainnet-beta',
        solanaAddress: owner,
        balance: 2500,
        tokenAccount: owner,
      }),
    )

    expect(tokensOf(store, owner)).toBeUndefined()
  })

  it('replaces the balance of the token account matching both account and mint', async () => {
    const { store, owner, hntAccount } = await syncedStore()

    store.dispatch(
      balancesSlice.actions.updateAtaBalance({
        cluster: 'mainnet-beta',
        solanaAddress: owner,
        balance: 777,
        mint: HNT_MINT.toBase58(),
        tokenAccount: hntAccount,
      }),
    )

    expect(tokensOf(store, owner).atas[0].balance).toBe(777)
  })

  it('ignores a token balance whose mint does not match the account', async () => {
    const { store, owner, hntAccount } = await syncedStore()

    store.dispatch(
      balancesSlice.actions.updateAtaBalance({
        cluster: 'mainnet-beta',
        solanaAddress: owner,
        balance: 777,
        mint: DC_MINT.toBase58(),
        tokenAccount: hntAccount,
      }),
    )

    expect(tokensOf(store, owner).atas).toEqual([
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
    const { store } = await syncedStore()

    store.dispatch({ type: PURGE })

    expect(store.getState().balances).toEqual({
      balances: { 'mainnet-beta': {}, devnet: {}, testnet: {} },
      balanceHistory: { 'mainnet-beta': {}, devnet: {}, testnet: {} },
    })
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
    const store = makeStore()

    await store.dispatch(readTokenPrices({ currency: 'usd' }))

    expect(getTokenPrices).toHaveBeenCalledWith('usd')
    expect(store.getState().balances.tokenPrices).toEqual({
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
    const store = makeStore()

    await store.dispatch(readTokenPrices({ currency: 'usd' }))
    await store.dispatch(readTokenPrices({ currency: 'eur' }))

    expect(store.getState().balances.tokenPrices).toEqual({
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
    const store = makeStore()

    await store.dispatch(readTokenPrices({ currency: 'usd' }))
    await store.dispatch(readTokenPrices({ currency: 'usd' }))

    expect(store.getState().balances.tokenPrices?.helium).toEqual({ usd: 2.5 })
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
    jest.mocked(getBalanceHistory).mockResolvedValueOnce(history)
    const store = makeStore()
    const owner = Keypair.generate().publicKey.toBase58()

    await store.dispatch(
      readBalanceHistory({
        currency: 'usd',
        cluster: 'devnet',
        solanaAddress: owner,
      }),
    )

    expect(getBalanceHistory).toHaveBeenCalledWith({
      currency: 'usd',
      cluster: 'devnet',
      solanaAddress: owner,
    })
    expect(store.getState().balances.balanceHistory.devnet[owner]).toEqual({
      usd: history,
    })
  })
})
