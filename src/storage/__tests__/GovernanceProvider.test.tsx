import '../../polyfill'
import React, { useEffect } from 'react'
import { act, create } from 'react-test-renderer'
import { NavigationContainer } from '@react-navigation/native'
import { GovernanceProvider, useGovernance } from '../GovernanceProvider'

type Route = { name: string; params?: { mint?: string } }

// The container ref that NavigationHelper creates. It keeps the parts of
// @react-navigation/core 7.24 createNavigationContainerRef that the app reads:
// isReady, getCurrentRoute, and 'state' listeners kept before the container
// mounts.
const mockContainer: {
  route?: Route
  listeners: (() => void)[]
  emitState: (route: Route) => void
} = {
  route: undefined,
  listeners: [],
  emitState(route) {
    this.route = route
    this.listeners.forEach((listener) => listener())
  },
}

// @react-navigation ships ESM only, which this jest config does not
// transform. useNavigationState keeps the check of @react-navigation/core
// useNavigationState: it throws when no navigator is above it. The container
// provides no navigator, and this test renders none.
jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react')
  const NavigationStateListener = ReactActual.createContext(undefined)
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      children,
    useNavigationState: (selector: (state: unknown) => unknown) => {
      const listener = ReactActual.useContext(NavigationStateListener)
      if (listener == null) {
        throw new Error(
          "Couldn't get the navigation state. Is your component inside a navigator?",
        )
      }
      return selector(listener)
    },
    createNavigationContainerRef: () => ({
      isReady: () => mockContainer.route !== undefined,
      getCurrentRoute: () => mockContainer.route,
      addListener: (_event: 'state', listener: () => void) => {
        mockContainer.listeners.push(listener)
        return () => {
          mockContainer.listeners = mockContainer.listeners.filter(
            (l) => l !== listener,
          )
        }
      },
    }),
  }
})

jest.mock(
  '@hooks/useCurrentRoute',
  () => jest.requireActual('../../hooks/useCurrentRoute'),
  { virtual: true },
)
jest.mock('@utils/config', () => ({}), { virtual: true })
jest.mock('@helium/spl-utils', () => ({
  HNT_MINT: { toBase58: () => 'hnt-mint' },
  MOBILE_MINT: { toBase58: () => 'mobile-mint' },
  IOT_MINT: { toBase58: () => 'iot-mint' },
}))
jest.mock('@helium/helium-react-hooks', () => ({
  useMint: () => ({ loading: false, info: undefined }),
}))
jest.mock('@helium/modular-governance-hooks', () => ({
  useOrganization: () => ({ loading: false, info: undefined }),
}))
jest.mock('@helium/organization-sdk', () => ({
  organizationKey: (name: string) => [name],
}))
// The real HeliumVsrStateProvider builds anchor Programs, and the anchor
// Program constructor clones its IDL with the global structuredClone.
jest.mock('@helium/voter-stake-registry-hooks', () => ({
  HeliumVsrStateProvider: ({ children }: { children: React.ReactNode }) => {
    structuredClone({ name: 'voter_stake_registry', instructions: [] })
    return children
  },
  getSubDaos: () => Promise.resolve([]),
  useHeliumVsrState: () => ({ loading: false, positions: [] }),
  useRegistrar: () => ({ loading: false, info: undefined }),
  useSubDaos: () => ({ result: undefined }),
}))
jest.mock('@helium/voter-stake-registry-sdk', () => ({
  getRegistrarKey: (mint: unknown) => mint,
}))
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ isLoading: false, data: undefined }),
}))
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({ anchorProvider: undefined }),
}))
jest.mock('../../store/appStore', () => ({
  useAppStore: (select: (state: { cluster: string }) => unknown) =>
    select({ cluster: 'mainnet-beta' }),
}))
jest.mock('../AccountStorageProvider', () => ({
  useAccountStorage: () => ({
    currentAccount: undefined,
    upsertAccount: () => Promise.resolve(),
  }),
}))

// Tell React that this runner wraps renders and state changes in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

let network: string | undefined
const Network = () => {
  const current = useGovernance().network
  useEffect(() => {
    network = current
  }, [current])
  return null
}

const renderInContainer = () =>
  act(() => {
    create(
      <NavigationContainer>
        <GovernanceProvider>
          <Network />
        </GovernanceProvider>
      </NavigationContainer>,
    )
  })

beforeEach(() => {
  mockContainer.route = undefined
  mockContainer.listeners = []
  network = undefined
})

describe('GovernanceProvider', () => {
  it('renders inside NavigationContainer with no navigator above it', async () => {
    await renderInContainer()

    expect(network).toBe('hnt')
  })

  it('renders HeliumVsrStateProvider with the app structuredClone polyfill', async () => {
    let error: unknown
    try {
      await renderInContainer()
    } catch (e) {
      error = e
    }

    expect(error).toBeUndefined()
    expect(network).toBe('hnt')
  })

  it('picks the network of the mint in the focused route params', async () => {
    await renderInContainer()

    await act(() => {
      mockContainer.emitState({
        name: 'ProposalsScreen',
        params: { mint: 'mobile-mint' },
      })
    })

    expect(network).toBe('mobile')
  })

  it('reads a route the container focused before it mounted', async () => {
    mockContainer.route = {
      name: 'ProposalsScreen',
      params: { mint: 'iot-mint' },
    }

    await renderInContainer()

    expect(network).toBe('iot')
  })
})
