import { PublicKey } from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { CheckableTokenListItem } from '../AccountManageTokenListScreen'

// A list row must not fetch: each hook of these modules throws if the row
// calls it. The screen calls them once for all rows.
function mockThrows(name: string) {
  return () => {
    throw new Error(`a token row called ${name}`)
  }
}

jest.mock('@helium/helium-react-hooks', () => ({
  useOwnedAmount: mockThrows('useOwnedAmount'),
}))
jest.mock(
  '@hooks/useCurrentWallet',
  () => ({ useCurrentWallet: mockThrows('useCurrentWallet') }),
  { virtual: true },
)
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: mockThrows('useMetaplexMetadata') }),
  { virtual: true },
)
jest.mock(
  '@hooks/usePublicKey',
  () => jest.requireActual('../../../hooks/usePublicKey'),
  { virtual: true },
)
jest.mock('@tanstack/react-query', () => ({
  useMutation: mockThrows('useMutation'),
  useQueryClient: mockThrows('useQueryClient'),
}))
jest.mock('@utils/Balance', () => ({ useBalance: mockThrows('useBalance') }), {
  virtual: true,
})
jest.mock('@utils/balances', () => ({ syncTokenAccounts: () => {} }), {
  virtual: true,
})
jest.mock(
  '@storage/AccountStorageProvider',
  () => ({ useAccountStorage: mockThrows('useAccountStorage') }),
  { virtual: true },
)
jest.mock(
  '@storage/TokensProvider',
  () => ({ useVisibleTokens: mockThrows('useVisibleTokens') }),
  { virtual: true },
)
jest.mock('../../../solana/SolanaProvider', () => ({
  useSolana: mockThrows('useSolana'),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: mockThrows('useNavigation'),
}))
jest.mock(
  '@utils/solanaUtils',
  () => ({
    humanReadable: (amount: { toString: () => string }, decimals: number) =>
      `${amount.toString()}e-${decimals}`,
  }),
  { virtual: true },
)
jest.mock('@helium/spl-utils', () => ({ DC_MINT: { toBase58: () => 'dc' } }))
jest.mock('@ui/Checkbox', () => ({ Checkbox: 'Checkbox' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/TokenIcon', () => ({ TokenIcon: 'TokenIcon' }), {
  virtual: true,
})
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('../AccountTokenCurrencyBalance', () => ({
  __esModule: true,
  default: 'AccountTokenCurrencyBalance',
}))
jest.mock('../logic/visibleTokens', () => ({ getSortValue: () => 0 }))
jest.mock('../useTokenRows', () => ({
  useTokenRows: mockThrows('useTokenRows'),
}))
jest.mock('react-native', () => ({
  View: 'View',
  RefreshControl: 'RefreshControl',
}))
jest.mock('react-native-gesture-handler', () => ({ FlatList: 'FlatList' }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ X: 'X' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const HNT = 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'

describe('CheckableTokenListItem', () => {
  it('renders a balance from plain props and toggles the token', () => {
    const onUpdateTokens = jest.fn()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <CheckableTokenListItem
          mint={HNT}
          bottomBorder={false}
          checked
          onUpdateTokens={onUpdateTokens}
          symbol="HNT"
          image="hnt.png"
          amount={BigInt(150000000)}
          decimals={8}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer

    expect(
      root.findAllByType('Text' as never).map((n) => n.props.children),
    ).toEqual(['150000000e-8 ', 'HNT'])
    expect(root.findByType('TokenIcon' as never).props.img).toBe('hnt.png')

    act(() => {
      root.findByType('Checkbox' as never).props.onChange()
    })
    expect(onUpdateTokens).toHaveBeenCalledWith(new PublicKey(HNT), false)
  })
})
