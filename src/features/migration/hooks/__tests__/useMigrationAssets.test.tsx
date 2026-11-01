import { Keypair } from '@solana/web3.js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BalanceProvider, useBalance } from '@utils/Balance'
import { TOKEN_ACCOUNTS_QUERY_KEY } from '@utils/balances'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { useMigrationAssets } from '../useMigrationAssets'

const mockWallet = Keypair.generate().publicKey
// One stable ref, as the real provider keeps
const mockAnchorProvider = { publicKey: mockWallet, connection: {} }
jest.mock('../../../../solana/SolanaProvider', () => ({
  useSolana: () => ({
    cluster: 'mainnet-beta',
    anchorProvider: mockAnchorProvider,
  }),
}))
const mockAccount = { solanaAddress: mockWallet.toBase58() }
jest.mock('../../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ currentAccount: mockAccount }),
}))
jest.mock('../../../../storage/AppStorageProvider', () => ({
  useAppStorage: () => ({ currency: 'USD', locked: false }),
}))
const mockTokenPrices = {}
jest.mock('../../../../utils/usePollTokenPrices', () => ({
  usePollTokenPrices: () => ({ tokenPrices: mockTokenPrices }),
}))
jest.mock('../../../../utils/useBalanceHistory', () => ({
  useBalanceHistory: () => ({ balanceHistory: [] }),
}))
jest.mock('../../../../utils/i18n', () => ({
  useLanguage: () => ({ language: 'en' }),
}))
jest.mock('../../../../utils/StoreAtaBalance', () => () => null)
jest.mock('../../../../utils/solanaUtils', () => ({ humanReadable: () => '0' }))
jest.mock('../../../../utils/walletApiV2', () => ({}))
// The sync never lands, so the wallet has no synced token data
jest.mock('../../../../utils/balances', () => ({
  ...jest.requireActual('../../../../utils/balances'),
  syncTokenAccounts: () => new Promise(() => {}),
}))
jest.mock('@helium/currency-utils', () => ({ getOraclePrice: jest.fn() }))
jest.mock(
  '@utils/Balance',
  () => jest.requireActual('../../../../utils/Balance'),
  { virtual: true },
)
jest.mock(
  '@utils/balances',
  () => jest.requireActual('../../../../utils/balances'),
  { virtual: true },
)
jest.mock(
  '@storage/TokensProvider',
  () => ({ useVisibleTokens: () => ({ visibleTokens: new Set() }) }),
  { virtual: true },
)
jest.mock(
  '@storage/BlockchainApiProvider',
  () => ({
    useBlockchainApi: () => ({
      migration: { getHotspots: () => Promise.resolve({ hotspots: [] }) },
    }),
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/usePublicKey',
  () => jest.requireActual('../../../../hooks/usePublicKey'),
  { virtual: true },
)
jest.mock('@helium/helium-react-hooks', () => ({
  useSolOwnedAmount: () => ({ amount: BigInt(0), loading: false }),
}))
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// TanStack notifies on a 0 ms timer, so let it run inside act
const settle = () =>
  act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 10)
    })
  })

const onRender = jest.fn<void, [{ tokenAccounts: unknown; loading: boolean }]>()
const Probe = () => {
  const { tokenAccounts } = useBalance()
  const { loading } = useMigrationAssets(mockWallet.toBase58())
  onRender({ tokenAccounts, loading })
  return null
}

it('keeps migration assets loading while the token list has not synced', async () => {
  const queryClient = new QueryClient()
  await act(async () => {
    TestRenderer.create(
      <QueryClientProvider client={queryClient}>
        <BalanceProvider>
          <Probe />
        </BalanceProvider>
      </QueryClientProvider>,
    )
  })
  await settle()

  expect(onRender.mock.lastCall?.[0]).toEqual({
    tokenAccounts: undefined,
    loading: true,
  })

  // The state a sync of an empty wallet stores
  await act(async () => {
    queryClient.setQueryData(
      [...TOKEN_ACCOUNTS_QUERY_KEY, 'mainnet-beta', mockWallet.toBase58()],
      { atas: [], sol: { tokenAccount: mockWallet.toBase58(), balance: 0 } },
    )
  })
  await settle()

  expect(onRender.mock.lastCall?.[0]).toEqual({
    tokenAccounts: [],
    loading: false,
  })
  queryClient.clear()
})
