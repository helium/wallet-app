import { AnchorProvider } from '@anchor-lang/core'
import { Keypair } from '@solana/web3.js'
import { QueryClient } from '@tanstack/react-query'
import { CSAccount } from '../../storage/cloudStorage'
import {
  TOKEN_SYNC_TIMEOUT,
  Tokens,
  syncTokenAccounts,
  tokenAccountsQueryOptions,
} from '../balances'

jest.mock('../walletApiV2', () => ({}))
// The account data is the mint's base58 bytes; the decoder reads it back.
jest.mock('../../store/logic/tokenAccounts', () => ({
  decodeTokenAccount: (data: Buffer) => ({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mint: new (require('@solana/web3.js').PublicKey)(data.toString()),
    amount: BigInt(1000),
    frozen: false,
  }),
}))

const mint = Keypair.generate().publicKey
// A mint account with 6 decimals at offset 44
const mintData = Buffer.alloc(82)
mintData[44] = 6

const fakeConnection = (overrides: Record<string, jest.Mock> = {}) => ({
  getTokenAccountsByOwner: jest.fn(() =>
    Promise.resolve({
      value: [
        {
          pubkey: Keypair.generate().publicKey,
          account: { data: Buffer.from(mint.toBase58()) },
        },
      ],
    }),
  ),
  getAccountInfo: jest.fn(() => Promise.resolve({ lamports: 5 })),
  getMultipleAccountsInfo: jest.fn(() => Promise.resolve([{ data: mintData }])),
  ...overrides,
})

const providerFor = (connection: ReturnType<typeof fakeConnection>) =>
  ({ connection }) as unknown as AnchorProvider

const newWallet = () => {
  const solanaAddress = Keypair.generate().publicKey.toBase58()
  return { acct: { solanaAddress } as CSAccount, solanaAddress }
}

const tokensKey = (solanaAddress: string) =>
  tokenAccountsQueryOptions({
    cluster: 'mainnet-beta',
    solanaAddress,
    anchorProvider: undefined,
  }).queryKey

let queryClient: QueryClient

beforeEach(() => {
  jest.useFakeTimers()
  queryClient = new QueryClient()
})

afterEach(() => {
  queryClient.clear()
  jest.useRealTimers()
})

describe('syncTokenAccounts', () => {
  it('keeps the synced balances when a mint batch fails', async () => {
    const { acct, solanaAddress } = newWallet()
    const connection = fakeConnection()

    const first = await syncTokenAccounts(queryClient, {
      cluster: 'mainnet-beta',
      acct,
      anchorProvider: providerFor(connection),
    })
    expect(first.atas[0]).toMatchObject({ mint: mint.toBase58(), decimals: 6 })

    // Past the 5 second cooldown, the mint lookup fails
    jest.advanceTimersByTime(5001)
    connection.getMultipleAccountsInfo.mockRejectedValueOnce(
      new Error('429 Too Many Requests'),
    )
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(
      syncTokenAccounts(queryClient, {
        cluster: 'mainnet-beta',
        acct,
        anchorProvider: providerFor(connection),
      }),
    ).rejects.toThrow('429 Too Many Requests')

    const stored = queryClient.getQueryData<Tokens>(tokensKey(solanaAddress))
    expect(stored?.atas).toEqual([
      expect.objectContaining({ mint: mint.toBase58(), decimals: 6 }),
    ])
  })

  it('stores nothing when the first sync has a mint batch failure', async () => {
    const { acct, solanaAddress } = newWallet()
    const connection = fakeConnection({
      getMultipleAccountsInfo: jest.fn(() =>
        Promise.reject(new Error('429 Too Many Requests')),
      ),
    })
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(
      syncTokenAccounts(queryClient, {
        cluster: 'mainnet-beta',
        acct,
        anchorProvider: providerFor(connection),
      }),
    ).rejects.toThrow('429 Too Many Requests')

    expect(queryClient.getQueryData(tokensKey(solanaAddress))).toBeUndefined()
  })

  it('times out a hung sync so the next wallet syncs', async () => {
    const hungWallet = newWallet()
    const hungConnection = fakeConnection({
      getTokenAccountsByOwner: jest.fn(() => new Promise<never>(() => {})),
    })
    const nextWallet = newWallet()

    const hung = syncTokenAccounts(queryClient, {
      cluster: 'mainnet-beta',
      acct: hungWallet.acct,
      anchorProvider: providerFor(hungConnection),
    })
    const hungSettled = hung.then(
      () => 'resolved',
      (e: Error) => e.message,
    )
    const next = syncTokenAccounts(queryClient, {
      cluster: 'mainnet-beta',
      acct: nextWallet.acct,
      anchorProvider: providerFor(fakeConnection()),
    })

    await jest.advanceTimersByTimeAsync(TOKEN_SYNC_TIMEOUT)

    // The pull-to-refresh mutation ends when its sync settles
    await expect(hungSettled).resolves.toBe('Token account sync timed out')
    await expect(next).resolves.toMatchObject({
      atas: [expect.objectContaining({ mint: mint.toBase58(), decimals: 6 })],
    })
    expect(
      queryClient.isFetching({ queryKey: tokensKey(hungWallet.solanaAddress) }),
    ).toBe(0)

    // A later sync of the hung wallet asks the RPC again
    hungConnection.getTokenAccountsByOwner.mockImplementation(() =>
      Promise.resolve({ value: [] }),
    )
    await jest.advanceTimersByTimeAsync(5001)
    await expect(
      syncTokenAccounts(queryClient, {
        cluster: 'mainnet-beta',
        acct: hungWallet.acct,
        anchorProvider: providerFor(hungConnection),
      }),
    ).resolves.toMatchObject({ atas: [], sol: { balance: 5 } })
    expect(hungConnection.getTokenAccountsByOwner).toHaveBeenCalledTimes(2)
  })
})
