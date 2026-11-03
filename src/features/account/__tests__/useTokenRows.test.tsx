import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import {
  LockedRowData,
  TokenRowData,
  useLockedAmounts,
  useTokenRows,
} from '../useTokenRows'

const mockWallet = new PublicKey('Vote111111111111111111111111111111111111111')
const mockHNT = new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux')
const mockMOBILE = new PublicKey('mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6')
const mockSOL = new PublicKey('So11111111111111111111111111111111111111112')

// One account read per account kind: the hook names the kind through its
// parser. Each token account holds 7 of its mint, each mint has 6 decimals.
const mockUseAccounts = jest.fn(
  (keys: PublicKey[] | undefined, parser: { name?: string }) => ({
    loading: false,
    accounts: keys?.map((publicKey) => ({
      publicKey,
      info:
        parser.name === 'MintParser'
          ? { decimals: publicKey.equals(mockSOL) ? 9 : 6 }
          : { amount: BigInt(7) },
    })),
  }),
)
// The governance context holds the positions of its own mint.
const mockContextPositions = [
  { amountDepositedNative: new BN(100) },
  { amountDepositedNative: new BN(5), isProxiedToMe: true },
]
const mockUseQuery = jest.fn()
const mockGetPositionKeys = jest.fn()
const mockPositions = jest.fn()

jest.mock('@helium/account-fetch-cache-hooks', () => ({
  useAccounts: (keys: PublicKey[] | undefined, parser: { name?: string }) =>
    mockUseAccounts(keys, parser),
}))
jest.mock('@helium/helium-react-hooks', () => ({
  MintParser: function MintParser() {},
  useSolOwnedAmount: () => ({ amount: BigInt(42), loading: false }),
}))
jest.mock(
  '@hooks/useCurrentWallet',
  () => ({ useCurrentWallet: () => mockWallet }),
  { virtual: true },
)
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({
    useStableKeys: jest.requireActual('../../../hooks/useMetaplexMetadata')
      .useStableKeys,
    useMetaplexMetadatas: (mints: PublicKey[]) =>
      Object.fromEntries(
        mints.map((mint) => [
          mint.toBase58(),
          {
            loading: false,
            symbol: `S-${mint.toBase58().slice(0, 3)}`,
            json: { image: `${mint.toBase58().slice(0, 3)}.png` },
          },
        ]),
      ),
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/usePrevious',
  () => jest.requireActual('../../../hooks/usePrevious'),
  { virtual: true },
)
jest.mock('@helium/voter-stake-registry-hooks', () => ({
  useHeliumVsrState: () => ({
    mint: mockHNT,
    loading: false,
    positions: mockContextPositions,
  }),
  usePositions: (keys: PublicKey[] | undefined) => mockPositions(keys),
}))
jest.mock('@helium/voter-stake-registry-sdk', () => ({
  getRegistrarKey: (mint: PublicKey) => mint,
  getPositionKeysForOwner: (args: unknown) => mockGetPositionKeys(args),
}))
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}))
jest.mock('../../../solana/SolanaProvider', () => {
  const solana = { connection: { rpcEndpoint: 'rpc' } }
  return { useSolana: () => solana }
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const renderHook = <T,>(hook: () => T) => {
  const result: { current?: T } = {}
  const Probe = () => {
    result.current = hook()
    return null
  }
  act(() => {
    TestRenderer.create(<Probe />)
  })
  return result
}

beforeEach(() => {
  mockUseAccounts.mockClear()
  mockUseQuery.mockReset()
  mockGetPositionKeys.mockReset()
  mockPositions.mockReset()
})

describe('useTokenRows', () => {
  it('reads the balances and decimals of all rows in one read each', () => {
    const result = renderHook(() =>
      useTokenRows([new PublicKey(mockHNT.toBase58()), mockSOL]),
    )
    const rows = result.current as Record<string, TokenRowData>

    expect(rows[mockHNT.toBase58()]).toEqual({
      symbol: 'S-hnt',
      image: 'hnt.png',
      loadingMetadata: false,
      amount: BigInt(7),
      decimals: 6,
      loadingOwned: false,
    })
    // mockSOL is the wallet's lamports, not a token account.
    expect(rows[mockSOL.toBase58()]).toMatchObject({
      amount: BigInt(42),
      decimals: 9,
    })
    expect(mockUseAccounts).toHaveBeenCalledTimes(2)
    mockUseAccounts.mock.calls.forEach(([keys]) => expect(keys).toHaveLength(2))
  })
})

describe('useLockedAmounts', () => {
  it('sums the context positions and fetches the other mints in one query', async () => {
    const mobilePosition = new PublicKey(
      'SysvarRent111111111111111111111111111111111',
    )
    const keysByMint = { [mockMOBILE.toBase58()]: [mobilePosition] }
    mockUseQuery.mockReturnValue({ data: keysByMint, isLoading: false })
    mockPositions.mockReturnValue({
      loading: false,
      accounts: [
        {
          publicKey: mobilePosition,
          info: { amountDepositedNative: new BN(30) },
        },
      ],
    })
    mockGetPositionKeys.mockResolvedValue({ positions: [mobilePosition] })

    const result = renderHook(() => useLockedAmounts([mockHNT, mockMOBILE]))
    const rows = result.current as Record<string, LockedRowData>

    // A position proxied to the wallet is not the wallet's own lock.
    expect(rows[mockHNT.toBase58()].amountLocked?.toString()).toBe('100')
    expect(rows[mockMOBILE.toBase58()].amountLocked?.toString()).toBe('30')
    expect(rows[mockHNT.toBase58()].loadingAmount).toBe(false)
    expect(mockPositions).toHaveBeenLastCalledWith([mobilePosition])

    const [options] = mockUseQuery.mock.calls[0]
    await expect(options.queryFn()).resolves.toEqual(keysByMint)
    expect(mockGetPositionKeys).toHaveBeenCalledTimes(1)
    expect(mockGetPositionKeys).toHaveBeenCalledWith({
      registrar: mockMOBILE,
      owner: mockWallet,
      connection: { rpcEndpoint: 'rpc' },
    })
  })

  it('keeps the locked amount of the other mints when one mint fails', async () => {
    const mockIOT = new PublicKey('iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns')
    const iotPosition = new PublicKey(
      'SysvarC1ock11111111111111111111111111111111',
    )
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true })
    mockPositions.mockImplementation((keys: PublicKey[] | undefined) => ({
      loading: false,
      accounts: keys?.map((publicKey) => ({
        publicKey,
        info: { amountDepositedNative: new BN(12) },
      })),
    }))
    mockGetPositionKeys.mockImplementation(
      ({ registrar }: { registrar: PublicKey }) =>
        registrar.equals(mockMOBILE)
          ? Promise.reject(new Error('rpc down'))
          : Promise.resolve({ positions: [iotPosition] }),
    )
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const mints = [mockHNT, mockMOBILE, mockIOT]

    renderHook(() => useLockedAmounts(mints))
    const [options] = mockUseQuery.mock.calls[0]
    const keysByMint = await options.queryFn()
    mockUseQuery.mockReturnValue({ data: keysByMint, isLoading: false })
    const result = renderHook(() => useLockedAmounts(mints))
    const rows = result.current as Record<string, LockedRowData>

    expect(rows[mockIOT.toBase58()].amountLocked?.toString()).toBe('12')
    expect(rows[mockMOBILE.toBase58()].amountLocked).toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
