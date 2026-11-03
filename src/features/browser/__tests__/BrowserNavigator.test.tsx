import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import BrowserNavigator from '../BrowserNavigator'

// @react-navigation ships ESM only, which this jest config does not
// transform. This stack keeps two parts of @react-navigation 7: core
// useNavigationBuilder checks initialRouteName once, on mount, and throws
// when no screen has that name; StackRouter keeps the route while its screen
// stays registered, and else opens the initial route (or the first screen).
jest.mock('@react-navigation/native-stack', () => {
  const ReactActual = jest.requireActual('react')
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({
        children,
        initialRouteName,
      }: {
        children: unknown
        initialRouteName?: string
      }) => {
        // The screens below are mocked as host components, named by string.
        const screens = ReactActual.Children.toArray(children) as {
          props: { name: string; component: string }
        }[]
        const names = screens.map((s) => s.props.name)
        const [initial] = ReactActual.useState(() => {
          if (initialRouteName != null && !names.includes(initialRouteName)) {
            throw new Error(
              `Couldn't find a screen named '${initialRouteName}' to use as 'initialRouteName'.`,
            )
          }
          return initialRouteName ?? names[0]
        })
        const [current, setCurrent] = ReactActual.useState(initial)
        let route = current
        if (!names.includes(route)) {
          route = names.includes(initial) ? initial : names[0]
          setCurrent(route)
        }
        const screen = screens.find((s) => s.props.name === route)
        return ReactActual.createElement(screen?.props.component)
      },
      Screen: () => null,
    }),
  }
})

// The two providers as one store: a change re-renders the hooks' readers, as
// a provider's context change does.
const mockStore = {
  state: {
    cluster: 'mainnet-beta',
    dAppTutorialShown: {} as Record<string, boolean>,
  },
  listeners: new Set<() => void>(),
}
const mockUseStore = () =>
  jest.requireActual('react').useSyncExternalStore(
    (listener: () => void) => {
      mockStore.listeners.add(listener)
      return () => mockStore.listeners.delete(listener)
    },
    () => mockStore.state,
  ) as typeof mockStore.state
jest.mock(
  '@storage/AppStorageProvider',
  () => ({
    useAppStorage: () => ({
      dAppTutorialShown: mockUseStore().dAppTutorialShown,
    }),
  }),
  { virtual: true },
)
jest.mock('../../../solana/SolanaProvider', () => ({
  useSolana: () => ({ cluster: mockUseStore().cluster }),
}))
jest.mock('../BrowserScreen', () => 'BrowserScreen')
jest.mock('../BrowserWebViewScreen', () => ({
  BrowserWrapper: 'BrowserWebViewScreen',
}))
jest.mock('../DAppTutorial', () => 'DAppTutorial')

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(<BrowserNavigator />)
  })
  if (!renderer) throw new Error('render failed')
  const view = renderer
  return {
    shows: (type: string) => view.root.findAllByType(type as never).length > 0,
  }
}

const notShown = { devnet: false, testnet: false, 'mainnet-beta': false }

const setStore = (state: Partial<typeof mockStore.state>) =>
  act(async () => {
    mockStore.state = { ...mockStore.state, ...state }
    mockStore.listeners.forEach((listener) => listener())
  })

describe('BrowserNavigator', () => {
  beforeEach(() => {
    mockStore.state = { cluster: 'mainnet-beta', dAppTutorialShown: notShown }
  })

  it('opens the tutorial when the cluster has not shown it', async () => {
    const view = await render()

    expect(view.shows('DAppTutorial')).toBe(true)
    expect(view.shows('BrowserScreen')).toBe(false)
  })

  it('opens the browser when the cluster has shown the tutorial', async () => {
    mockStore.state.dAppTutorialShown = { ...notShown, 'mainnet-beta': true }

    const view = await render()

    expect(view.shows('BrowserScreen')).toBe(true)
    expect(view.shows('DAppTutorial')).toBe(false)
  })

  it('opens the browser when the tutorial completes while the stack is open', async () => {
    const view = await render()

    // DAppTutorial stores the completion, then replaces itself.
    await setStore({ dAppTutorialShown: { ...notShown, 'mainnet-beta': true } })

    expect(view.shows('BrowserScreen')).toBe(true)
    expect(view.shows('DAppTutorial')).toBe(false)
  })

  it('keeps the browser open on a switch to a cluster that has not shown the tutorial', async () => {
    mockStore.state.dAppTutorialShown = { ...notShown, 'mainnet-beta': true }
    const view = await render()

    await setStore({ cluster: 'devnet' })

    expect(view.shows('BrowserScreen')).toBe(true)
  })
})
