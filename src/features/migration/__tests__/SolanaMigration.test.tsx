import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { NavigationContainer } from '@react-navigation/native'
import SolanaMigration from '../SolanaMigration'

const mockGoBack = jest.fn()

// @react-navigation ships ESM only, which this jest config does not
// transform. useNavigation keeps the check of @react-navigation/core
// useNavigation: it throws when no navigator or container is above it.
jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react')
  const NavigationRef = ReactActual.createContext(undefined)
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(
        NavigationRef.Provider,
        { value: { goBack: mockGoBack } },
        children,
      ),
    useNavigation: () => {
      const navigation = ReactActual.useContext(NavigationRef)
      if (navigation === undefined) {
        throw new Error(
          "Couldn't find a navigation object. Is your component inside NavigationContainer?",
        )
      }
      return navigation
    },
  }
})

// No anchorProvider, so the migration effect returns before any request. The
// providers hand out stable values, as the real ones do: the effect depends
// on them.
jest.mock('../../../solana/SolanaProvider', () => {
  const solana = { anchorProvider: undefined, cluster: 'mainnet-beta' }
  return { useSolana: () => solana }
})
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = { currentAccount: { solanaAddress: 'wallet-address' } }
  return { useAccountStorage: () => accountStorage }
})
jest.mock('../../../storage/AppStorageProvider', () => {
  const appStorage = {
    updateDoneSolanaMigration: () => Promise.resolve(),
    doneSolanaMigration: {},
    updateManualMigration: () => Promise.resolve(),
  }
  return { useAppStorage: () => appStorage }
})
jest.mock('../../../storage/BlockchainApiProvider', () => {
  const client = {}
  return { useBlockchainApi: () => client }
})
jest.mock('../../../hooks/useHotspots', () => ({ refreshHotspots: () => {} }))
jest.mock('../../../utils/logger', () => ({ error: () => {} }))
jest.mock('@tanstack/react-query', () => {
  const queryClient = {}
  return { useQueryClient: () => queryClient }
})
jest.mock('@utils/transactionUtils', () => ({}), { virtual: true })
jest.mock('@utils/config', () => ({}), { virtual: true })
jest.mock('@theme/motion', () => ({ FADE_IN: {}, FADE_OUT: {} }), {
  virtual: true,
})
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('text-encoding-polyfill', () => ({}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ ChevronLeft: 'ChevronLeft' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = async (element: React.ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(element)
  })
  if (!renderer) throw new Error('render failed')
  const { root } = renderer
  return {
    texts: () =>
      root.findAllByType('Text' as never).map((n) => n.props.children),
    backButtons: () => root.findAllByType('PressableScale' as never),
  }
}

beforeEach(() => {
  mockGoBack.mockClear()
})

describe('SolanaMigration', () => {
  // The TabBar renders it with hideBack in the root Portal, outside
  // NavigationContainer.
  it('renders with hideBack outside a NavigationContainer', async () => {
    const view = await render(<SolanaMigration hideBack />)

    expect(view.texts()).toContain('solanaMigrationScreen.migrationComplete')
    expect(view.texts()).not.toContain('migrateToWorld.back')
  })

  it('shows a back header that goes back inside a NavigationContainer', async () => {
    const view = await render(
      <NavigationContainer>
        <SolanaMigration hideBack={false} />
      </NavigationContainer>,
    )

    expect(view.texts()).toContain('migrateToWorld.back')
    act(() => {
      view.backButtons()[0].props.onPress()
    })
    expect(mockGoBack).toHaveBeenCalledTimes(1)
  })

  it('lets a caller className replace the default background', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    await act(async () => {
      renderer = TestRenderer.create(
        <SolanaMigration hideBack className="bg-card" />,
      )
    })
    if (!renderer) throw new Error('render failed')

    expect(
      renderer.root.findAllByType('View' as never)[0].props.className,
    ).toBe('flex-1 bg-card')
  })
})
