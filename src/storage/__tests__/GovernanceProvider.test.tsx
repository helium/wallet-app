import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { NavigationContainer } from '@react-navigation/native'
import { MOBILE_MINT } from '@helium/spl-utils'
import { GovernanceProvider, useGovernance } from '../GovernanceProvider'

type Route = { name: string; params?: { mint?: string } }

const mockRef: {
  ready: boolean
  route?: Route
  listeners: Set<() => void>
} = { ready: false, route: undefined, listeners: new Set() }

// Like the real ref, the route read throws before the container is ready.
const mockGetCurrentRoute = jest.fn(() => {
  if (!mockRef.ready) throw new Error('The navigation container is not ready')
  return mockRef.route
})

// @react-navigation ships ESM only, which this jest config does not
// transform. The container here provides no navigation state, as the real
// NavigationContainer does until a navigator mounts. useNavigationState keeps
// the check of @react-navigation/core: it throws when no navigator is above it.
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) =>
    children,
  useNavigationState: () => {
    throw new Error(
      "Couldn't get the navigation state. Is your component inside a navigator?",
    )
  },
}))

// The app's container ref: the focused leaf route and the container's
// 'state' event, as createNavigationContainerRef exposes them.
jest.mock('../../navigation/NavigationHelper', () => ({
  navigationRef: {
    isReady: () => mockRef.ready,
    getCurrentRoute: () => mockGetCurrentRoute(),
    addListener: (_type: 'state', listener: () => void) => {
      mockRef.listeners.add(listener)
      return () => mockRef.listeners.delete(listener)
    },
  },
}))

jest.mock('@utils/config', () => ({}), { virtual: true })
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ isLoading: false, data: undefined }),
}))
jest.mock('@helium/helium-react-hooks', () => ({
  useMint: () => ({ loading: false, info: undefined }),
}))
jest.mock('@helium/modular-governance-hooks', () => ({
  useOrganization: () => ({ loading: false, info: undefined }),
}))
jest.mock('@helium/voter-stake-registry-hooks', () => ({
  HeliumVsrStateProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  getSubDaos: jest.fn(),
  useHeliumVsrState: () => ({}),
  useRegistrar: () => ({ loading: false, info: undefined }),
  useSubDaos: () => ({ loading: false, result: undefined }),
}))
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({ anchorProvider: undefined }),
}))
jest.mock('../AccountStorageProvider', () => ({
  useAccountStorage: () => ({
    upsertAccount: jest.fn(),
    currentAccount: undefined,
  }),
}))
jest.mock('../../store/appStore', () => ({
  useAppStore: (select: (state: object) => unknown) => select({}),
}))

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const mockOnNetwork = jest.fn()
const Probe = () => {
  mockOnNetwork(useGovernance().network)
  return null
}
const lastNetwork = () => mockOnNetwork.mock.lastCall?.[0]

const renderOutsideNavigator = () => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <NavigationContainer>
        <GovernanceProvider>
          <Probe />
        </GovernanceProvider>
      </NavigationContainer>,
    )
  })
  return renderer
}

const emitState = (route: Route) =>
  act(() => {
    mockRef.ready = true
    mockRef.route = route
    mockRef.listeners.forEach((listener) => listener())
  })

beforeEach(() => {
  mockOnNetwork.mockClear()
  mockGetCurrentRoute.mockClear()
  mockRef.ready = false
  mockRef.route = undefined
  mockRef.listeners.clear()
})

describe('GovernanceProvider inside a NavigationContainer with no navigator', () => {
  it('renders and falls back to hnt before the first navigation state', () => {
    renderOutsideNavigator()

    expect(lastNetwork()).toBe('hnt')
  })

  it('picks the network from the mint param of the focused route', () => {
    renderOutsideNavigator()

    emitState({
      name: 'ProposalsScreen',
      params: { mint: MOBILE_MINT.toBase58() },
    })
    expect(lastNetwork()).toBe('mobile')

    emitState({ name: 'AccountsScreen' })
    expect(lastNetwork()).toBe('hnt')
  })

  it('falls back to hnt for a mint that is not a governance network', () => {
    renderOutsideNavigator()

    emitState({
      name: 'ProposalsScreen',
      params: { mint: 'So11111111111111111111111111111111111111112' },
    })
    expect(lastNetwork()).toBe('hnt')
  })

  it('falls back to hnt for a mint that is an Object.prototype key', () => {
    renderOutsideNavigator()

    emitState({ name: 'ProposalsScreen', params: { mint: 'constructor' } })
    expect(lastNetwork()).toBe('hnt')
  })

  it('stops reading the route after unmount', () => {
    const renderer = renderOutsideNavigator()
    act(() => renderer.unmount())
    mockGetCurrentRoute.mockClear()

    emitState({
      name: 'ProposalsScreen',
      params: { mint: MOBILE_MINT.toBase58() },
    })
    expect(mockGetCurrentRoute).not.toHaveBeenCalled()
  })
})
