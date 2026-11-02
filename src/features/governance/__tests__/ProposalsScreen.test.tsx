import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Portal } from '@gorhom/portal'
import { NavigationContainer } from '@react-navigation/native'
import { Text } from '@ui/Text'
import { GovernanceModal } from '../components/GovernanceModal'
import GovernanceWrapper from '../GovernanceWrapper'
import ProposalsScreen from '../ProposalsScreen'

const mockNavigate = jest.fn()

// The node test runner cannot load gorhom (Reanimated, gesture handler). This
// model keeps the part that decides where sheet content renders, as gorhom
// 5.2.14 does it: the provider wraps its children in
// <PortalProvider rootHostName={hostName}>, and a presented modal mounts its
// content with <Portal hostName={hostName}> of the nearest provider.
jest.mock('@ui/TabSafeAreaView', () => ({ TabSafeAreaView: 'SafeAreaView' }), {
  virtual: true,
})
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
    BottomSheetView: 'BottomSheetView',
  }
})

// @react-navigation ships ESM only, which this jest config does not
// transform. useNavigation keeps the check of @react-navigation/core
// useNavigation: it throws when no navigator or container is above it.
jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react')
  const NavigationRef = ReactActual.createContext(undefined)
  const navigation = {
    navigate: (...args: unknown[]) => mockNavigate(...args),
    push: () => {},
  }
  const route = { params: {} }
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      ReactActual.createElement(
        NavigationRef.Provider,
        { value: navigation },
        children,
      ),
    useNavigation: () => {
      const nav = ReactActual.useContext(NavigationRef)
      if (nav === undefined) {
        throw new Error(
          "Couldn't find a navigation object. Is your component inside NavigationContainer?",
        )
      }
      return nav
    },
    useRoute: () => route,
  }
})

jest.mock(
  '@storage/GovernanceProvider',
  () => {
    const governance = {
      loading: false,
      mint: { toBase58: () => 'hnt-mint' },
      organization: undefined,
    }
    return { useGovernance: () => governance }
  },
  { virtual: true },
)
jest.mock(
  '@storage/AccountStorageProvider',
  () => {
    const accountStorage = {
      currentAccount: {
        proposalIdsSeenByMint: { 'hnt-mint': [] },
        proposalCountByMint: { 'hnt-mint': 2 },
      },
      upsertAccount: () => Promise.resolve(),
    }
    return { useAccountStorage: () => accountStorage }
  },
  { virtual: true },
)
jest.mock('@helium/modular-governance-hooks', () => {
  const proposal = (name: string) => ({
    publicKey: { toBase58: () => name },
    info: { name, state: name },
  })
  const proposals = {
    loading: false,
    accounts: [proposal('active'), proposal('passed')],
  }
  return { useOrganizationProposals: () => proposals }
})
jest.mock(
  '@utils/governanceUtils',
  () => ({
    getDerivedProposalState: (p: { state: string }) => p.state,
  }),
  { virtual: true },
)
jest.mock('../ProposalCard', () => ({ ProposalCard: 'ProposalCard' }))
jest.mock('../VotingPowerCard', () => ({ VotingPowerCard: () => null }))

jest.mock('@ui/Sheet', () => jest.requireActual('../../../ui/Sheet'), {
  virtual: true,
})
jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: () => {}, setIsShowing: () => {} }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ SHEET_TIMING: {}, FADE_IN: {} }), {
  virtual: true,
})
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('react-native', () => ({
  View: 'View',
  ScrollView: 'ScrollView',
  Platform: { OS: 'ios' },
  StyleSheet: { absoluteFill: {} },
}))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { createAnimatedComponent: (c: unknown) => c },
}))
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  ChevronDown: 'ChevronDown',
  CircleCheck: 'CircleCheck',
  Flag: 'Flag',
  UserStar: 'UserStar',
  Zap: 'Zap',
  X: 'X',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// src/App.tsx: the root BottomSheetModalProvider sits outside
// NavigationContainer, and the screen renders inside NavigationContainer.
const AppTree = () => (
  <BottomSheetModalProvider>
    <NavigationContainer>
      <ProposalsScreen />
    </NavigationContainer>
  </BottomSheetModalProvider>
)

const render = () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(<AppTree />)
  })
  if (!renderer) throw new Error('render failed')
  return renderer.root
}

const textOf = (node: TestRenderer.ReactTestInstance) =>
  node.findAllByType('Text' as never).map((n) => n.props.children)

// Sheet content must mount inside the governance wrapper, under its own
// sheet provider, and not in the app root host.
const screenOf = (root: TestRenderer.ReactTestInstance) =>
  root.findByType(GovernanceWrapper)

const pressablesOf = (node: TestRenderer.ReactTestInstance) =>
  node.findAllByType('PressableScale' as never)

describe('ProposalsScreen', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('opens the tab select inside the screen and switches tab', () => {
    const root = render()
    const tabSelect = pressablesOf(root).find(
      (p) => p.props.testID === 'Governance.TabSelect',
    )
    if (!tabSelect) throw new Error('no tab select')
    expect(
      pressablesOf(root).find((p) => p.props.testID === 'Select.positions'),
    ).toBeUndefined()

    act(() => {
      tabSelect.props.onPress()
    })

    const positions = pressablesOf(screenOf(root)).find(
      (p) => p.props.testID === 'Select.positions',
    )
    if (!positions) throw new Error('no positions option in the screen')
    act(() => {
      positions.props.onPress()
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      'PositionsScreen',
      { mint: 'hnt-mint' },
      { pop: true },
    )
  })

  it('opens the proposal filter inside the screen and filters the list', () => {
    const root = render()
    expect(root.findAllByType('ProposalCard' as never)).toHaveLength(2)
    const filterButton = pressablesOf(root).find((p) =>
      textOf(p).includes('gov.proposals.filter'),
    )
    if (!filterButton) throw new Error('no filter button')

    act(() => {
      filterButton.props.onPress()
    })

    const active = pressablesOf(screenOf(root)).find((p) =>
      textOf(p).includes('Active'),
    )
    if (!active) throw new Error('no Active filter in the screen')
    act(() => {
      active.props.onPress()
    })

    const cards = root.findAllByType('ProposalCard' as never)
    expect(cards.map((c) => c.props.filter)).toEqual(['active'])
  })

  // PositionsScreen shape: the position modals and the Manage menus are
  // portals in the wrapper's children, under the wrapper's sheet provider.
  it('renders governance modals and default portals from its children', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <BottomSheetModalProvider>
          <NavigationContainer>
            <GovernanceWrapper selectedTab="positions">
              <GovernanceModal onClose={() => {}}>
                <Text>governance-modal</Text>
              </GovernanceModal>
              <Portal>
                <Text>default-portal</Text>
              </Portal>
            </GovernanceWrapper>
          </NavigationContainer>
        </BottomSheetModalProvider>,
      )
    })
    if (!renderer) throw new Error('render failed')

    const texts = textOf(renderer.root)
    expect(texts).toContain('governance-modal')
    expect(texts).toContain('default-portal')
    // The root host comes after the modal host, so the keyboard sheet that a
    // position modal portals to root draws over the modal.
    expect(texts.indexOf('default-portal')).toBeGreaterThan(
      texts.indexOf('governance-modal'),
    )
  })
})
