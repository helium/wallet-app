import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AccountTokenList from '../AccountTokenList'

// The node test runner cannot load gorhom, React Native or the native module,
// so they render as host elements by name.
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetFlatList: 'BottomSheetFlatList',
}))
jest.mock('../../../../modules/scroll-edge-effect', () => ({
  HideBottomEdgeEffect: 'HideBottomEdgeEffect',
}))
jest.mock('react-native', () => ({
  RefreshControl: 'RefreshControl',
  StyleSheet: { create: (styles: unknown) => styles },
  View: 'View',
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}))
jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ isPending: false, mutate: jest.fn() }),
  useQueryClient: () => ({}),
}))
jest.mock('@solana/web3.js', () => ({ PublicKey: jest.fn() }))
jest.mock(
  '@storage/AccountStorageProvider',
  () => ({ useAccountStorage: () => ({}) }),
  { virtual: true },
)
jest.mock(
  '@storage/TokensProvider',
  () => ({ useVisibleTokens: () => ({ visibleTokens: new Set() }) }),
  { virtual: true },
)
jest.mock('@utils/Balance', () => ({ useBalance: () => ({}) }), {
  virtual: true,
})
jest.mock('@utils/balances', () => ({ syncTokenAccounts: jest.fn() }), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  {
    virtual: true,
  },
)
jest.mock('../../../utils/constants', () => ({ GovMints: [] }))
jest.mock('../../../solana/SolanaProvider', () => ({ useSolana: () => ({}) }))
jest.mock('../logic/visibleTokens', () => ({ deriveVisibleMints: () => [] }))
jest.mock('../useTokenRows', () => ({
  useTokenRows: () => ({}),
  useLockedAmounts: () => ({}),
}))
jest.mock('../TokenListItem', () => ({
  TokenListItem: 'TokenListItem',
  TokenListGovItem: 'TokenListGovItem',
  TokenSkeleton: 'TokenSkeleton',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  SlidersHorizontal: 'SlidersHorizontal',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('AccountTokenList', () => {
  it('hides the native bottom edge effect on the drawer list', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<AccountTokenList />)
    })

    // UIKit pins the tab bar's edge effect to the list in the list's own
    // coordinates, so it does not follow the sheet. The drawer draws its own
    // fade instead.
    const edgeEffect = renderer.root.findByType(
      'HideBottomEdgeEffect' as unknown as React.ElementType,
    )
    expect(
      edgeEffect.findAllByType(
        'BottomSheetFlatList' as unknown as React.ElementType,
      ),
    ).toHaveLength(1)
  })
})
