import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { AccountContext } from '@helium/account-fetch-cache-hooks'
import MigrateToWorld from '../MigrateToWorld'

// The node test runner cannot load gorhom (Reanimated, gesture handler). This
// model keeps the part that decides where sheet content renders, as gorhom
// 5.2.14 does it: the provider wraps its children in
// <PortalProvider rootHostName={hostName}>, and a presented modal mounts its
// content with <Portal hostName={hostName}> of the nearest provider.
jest.mock('@gorhom/bottom-sheet', () => {
  const ReactActual = jest.requireActual('react')
  const { Portal, PortalProvider } = jest.requireActual('@gorhom/portal')
  const HostName = ReactActual.createContext(undefined)
  let nextId = 0
  const ModalProvider = ({ children }: { children: React.ReactNode }) => {
    const [hostName] = ReactActual.useState(
      () => `bottom-sheet-portal-${(nextId += 1)}`,
    )
    return ReactActual.createElement(
      HostName.Provider,
      { value: hostName },
      ReactActual.createElement(PortalProvider, { rootHostName: hostName }, [
        children,
      ]),
    )
  }
  const BottomSheetModal = ReactActual.forwardRef(
    ({ children }: { children: React.ReactNode }, ref: unknown) => {
      const hostName = ReactActual.useContext(HostName)
      const [mount, setMount] = ReactActual.useState(false)
      ReactActual.useImperativeHandle(ref, () => ({
        present: () => setMount(true),
        dismiss: () => setMount(false),
      }))
      return mount
        ? ReactActual.createElement(Portal, { hostName }, children)
        : null
    },
  )
  return {
    BottomSheetModalProvider: ModalProvider,
    BottomSheetModal,
    BottomSheetBackdrop: 'BottomSheetBackdrop',
    // Renders every row.
    BottomSheetFlatList: ({
      data,
      renderItem,
      keyExtractor,
    }: {
      data: unknown[]
      renderItem: (info: { item: unknown }) => React.ReactElement
      keyExtractor: (item: unknown) => string
    }) =>
      data.map((item) =>
        ReactActual.createElement(
          ReactActual.Fragment,
          { key: keyExtractor(item) },
          renderItem({ item }),
        ),
      ),
  }
})

// A token row resolves metadata through the account fetch cache, which
// SolanaProvider supplies; outside it the cache hook throws.
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => {
    const { useAccountFetchCache } = jest.requireActual(
      '@helium/account-fetch-cache-hooks',
    )
    return {
      useMetaplexMetadata: () => {
        useAccountFetchCache()
        return {}
      },
    }
  },
  { virtual: true },
)
jest.mock('@hooks/usePublicKey', () => ({ usePublicKey: (k: string) => k }), {
  virtual: true,
})
jest.mock('@ui/Sheet', () => jest.requireActual('../../../ui/Sheet'), {
  virtual: true,
})
jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: () => {}, setIsShowing: () => {} }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ SHEET_TIMING: {} }), { virtual: true })

jest.mock('../hooks/useMigrationSession', () => ({
  useMigrationSession: () => ({
    step: 'select',
    setStep: () => {},
    persist: () => {},
    resume: {},
    clear: () => {},
  }),
}))
jest.mock('../hooks/useMigrationAssets', () => ({
  useMigrationAssets: () => ({
    hotspots: [],
    tokens: [
      {
        mint: jest.requireActual('../logic/mints').WSOL_MINT,
        label: 'SOL',
        decimals: 9,
        maxUi: '1.5',
      },
    ],
    leftBehindMints: [],
    loading: false,
    error: undefined,
    reload: () => Promise.resolve(),
  }),
}))
jest.mock('../hooks/useMigrationExecutor', () => ({
  useMigrationExecutor: () => ({ run: () => {}, progress: undefined }),
}))
// The steps this test does not reach.
jest.mock('../components/IntroStep', () => () => null)
jest.mock('../components/ConnectStep', () => () => null)
jest.mock('../components/EmailLoginStep', () => () => null)
jest.mock('../components/OutcomeStep', () => () => null)
jest.mock('../components/ProgressStep', () => () => null)
jest.mock('../components/ReviewStep', () => () => null)
jest.mock('../components/SuccessStep', () => () => null)
jest.mock('../components/WalletCreateErrorStep', () => () => null)
jest.mock('../components/HotspotsEditSheet', () => () => null)
jest.mock('../components/WorldLoader', () => () => null)

jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock(
  '@storage/GovernanceProvider',
  () => ({ useGovernance: () => ({ positions: [] }) }),
  { virtual: true },
)
jest.mock(
  '@storage/AppStorageProvider',
  () => ({ useAppStorage: () => ({ currency: 'USD' }) }),
  { virtual: true },
)
jest.mock('@utils/logger', () => ({ error: () => {} }), { virtual: true })
jest.mock('@utils/Balance', () => ({ numberFormat: () => '' }), {
  virtual: true,
})
jest.mock('@utils/balances', () => ({ tokenPricesQueryOptions: () => ({}) }), {
  virtual: true,
})
jest.mock('@utils/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/TokenIcon', () => ({ TokenIcon: 'TokenIcon' }), {
  virtual: true,
})
jest.mock('@ui/Checkbox', () => ({ Checkbox: 'Checkbox' }), { virtual: true })
jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({}) }))
jest.mock('@privy-io/expo', () => ({
  usePrivy: () => ({ user: undefined }),
  useEmbeddedSolanaWallet: () => ({ status: 'not-created' }),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: () => {} }),
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  Linking: { openURL: () => Promise.resolve() },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  Check: 'Check',
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// src/App.tsx: the root BottomSheetModalProvider wraps SolanaProvider (the
// account fetch cache), and the screen renders inside SolanaProvider.
const AppTree = () => (
  <BottomSheetModalProvider>
    <AccountContext.Provider value={{} as never}>
      <MigrateToWorld />
    </AccountContext.Provider>
  </BottomSheetModalProvider>
)

const textOf = (node: TestRenderer.ReactTestInstance) =>
  node.findAllByType('Text' as never).map((n) => n.props.children)

describe('MigrateToWorld', () => {
  it('opens the Tokens edit sheet inside the app providers', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<AppTree />)
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer
    const tokensCard = root
      .findAllByType('PressableScale' as never)
      .find((card) =>
        textOf(card).includes('migrateToWorld.selectAssets.tokens'),
      )
    if (!tokensCard) throw new Error('no Tokens card')
    expect(textOf(root)).not.toContain('SOL')

    act(() => {
      tokensCard.props.onPress()
    })

    expect(textOf(root)).toContain('SOL')
    expect(
      root.findAllByType('Input' as never).map((n) => n.props.value),
    ).toEqual(['1.5'])
  })
})
