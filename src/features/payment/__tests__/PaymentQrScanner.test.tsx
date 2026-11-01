import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
// @react-navigation/native re-exports core; core runs without React Native.
// eslint-disable-next-line import-x/no-extraneous-dependencies
import {
  BaseNavigationContainer,
  createNavigationContainerRef,
  createNavigatorFactory,
  NavigationContainerRefWithCurrent,
  NavigationState,
  ParamListBase,
  StackRouter,
  TabRouter,
  useNavigationBuilder,
} from '@react-navigation/core'
import PaymentQrScanner from '../PaymentQrScanner'

// @react-navigation/native re-exports useNavigation from @react-navigation/core.
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.requireActual('@react-navigation/core').useNavigation,
}))

let scan: (data: string) => void = () => {}
jest.mock(
  '@ui/QrScanner',
  () => ({
    QrScanner: ({
      onBarCodeScanned,
    }: {
      onBarCodeScanned: (data: string) => void
    }) => {
      scan = onBarCodeScanned
      return null
    },
  }),
  { virtual: true },
)
jest.mock('@hooks/useHaptic', () => () => ({ triggerNotification: () => {} }), {
  virtual: true,
})
jest.mock('@hooks/useAlert', () => () => ({ showOKAlert: jest.fn() }), {
  virtual: true,
})
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
// linking.ts loads these for its other parsers; parseBurn and parseDelegate run for real.
jest.mock('expo-linking', () => ({ createURL: () => 'helium://' }))
// A QR payload with no query string parses to itself as the url.
jest.mock('query-string', () => ({
  parseUrl: (url: string) => ({ url, query: {} }),
}))
jest.mock('../../../storage/AccountStorageProvider', () => ({}))
jest.mock('../../../utils/accountUtils', () => ({
  solAddressIsValid: () => false,
}))

// A navigator on the routers the native stack and bottom tabs use. It keeps
// every route mounted, as both do, so an unfocused tab keeps its stack.
const makeNavigator = (router: typeof StackRouter | typeof TabRouter) =>
  createNavigatorFactory(
    (props: Parameters<typeof useNavigationBuilder>[1]) => {
      const { state, descriptors, NavigationContent } = useNavigationBuilder(
        router,
        props,
      )
      return (
        <NavigationContent>
          {state.routes.map((route) => (
            <React.Fragment key={route.key}>
              {descriptors[route.key].render()}
            </React.Fragment>
          ))}
        </NavigationContent>
      )
    },
  )()

const Screen = () => null

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// The Home and Collectables stacks of HomeNavigator and CollectablesNavigator,
// cut to the routes this flow passes through, under the tab bar and root.
const HomeStack = makeNavigator(StackRouter)
const Home = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen name="AccountsScreen" component={Screen} />
    <HomeStack.Screen name="PaymentScreen" component={Screen} />
    <HomeStack.Screen name="BurnScreen" component={Screen} />
    <HomeStack.Screen name="PaymentQrScanner" component={PaymentQrScanner} />
  </HomeStack.Navigator>
)

const CollectablesStack = makeNavigator(StackRouter)
const Collectables = () => (
  <CollectablesStack.Navigator>
    <CollectablesStack.Screen name="CollectablesTopTab" component={Screen} />
    <CollectablesStack.Screen name="PaymentScreen" component={Screen} />
    <CollectablesStack.Screen
      name="PaymentQrScanner"
      component={PaymentQrScanner}
    />
  </CollectablesStack.Navigator>
)

const Tabs = makeNavigator(TabRouter)
const TabBar = () => (
  <Tabs.Navigator>
    <Tabs.Screen name="Home" component={Home} />
    <Tabs.Screen name="Collectables" component={Collectables} />
  </Tabs.Navigator>
)

const RootStack = makeNavigator(StackRouter)

const renderAt = (
  tab: 'Home' | 'Collectables',
  underScanner: string[],
  prepare: (
    ref: NavigationContainerRefWithCurrent<ParamListBase>,
  ) => void = () => {},
) => {
  const ref = createNavigationContainerRef<ParamListBase>()
  act(() => {
    TestRenderer.create(
      <BaseNavigationContainer ref={ref}>
        <RootStack.Navigator>
          <RootStack.Screen name="TabBarNavigator" component={TabBar} />
        </RootStack.Navigator>
      </BaseNavigationContainer>,
    )
  })
  prepare(ref)
  act(() => {
    ref.navigate('TabBarNavigator', { screen: tab })
  })
  underScanner.forEach((screen) => {
    act(() => {
      ref.navigate(screen)
    })
  })
  act(() => {
    ref.navigate('PaymentQrScanner')
  })
  expect(ref.getCurrentRoute()?.name).toBe('PaymentQrScanner')
  return ref
}

const tabStack = (ref: ReturnType<typeof renderAt>, tab: string) => {
  const tabs = ref.getRootState()?.routes[0]?.state as NavigationState
  const route = tabs.routes.find((r) => r.name === tab)
  return route?.state as NavigationState | undefined
}

const homeRoutes = (ref: ReturnType<typeof renderAt>) =>
  tabStack(ref, 'Home')?.routes.map((r) => ({
    name: r.name,
    params: r.params,
  }))

const burnQr = { type: 'dc_burn', address: 'burn-address', amount: '10' }
const delegateQr = {
  type: 'dc_delegate',
  address: 'delegate-address',
  amount: '5',
  memo: 'memo',
  mint: 'dc-mint',
}
const delegateParams = {
  isDelegate: true,
  address: 'delegate-address',
  amount: '5',
  memo: 'memo',
  mint: 'dc-mint',
}

describe('PaymentQrScanner', () => {
  it('replaces the Home payment screen with the burn screen for a burn QR', async () => {
    const ref = renderAt('Home', ['PaymentScreen'])

    await act(async () => {
      scan(JSON.stringify(burnQr))
    })

    expect(ref.getCurrentRoute()).toMatchObject({
      name: 'BurnScreen',
      params: burnQr,
    })
    expect(homeRoutes(ref)).toEqual([
      { name: 'AccountsScreen', params: undefined },
      { name: 'BurnScreen', params: burnQr },
    ])
  })

  it('replaces the Home payment screen with the burn screen for a delegate QR', async () => {
    const ref = renderAt('Home', ['PaymentScreen'])

    await act(async () => {
      scan(JSON.stringify(delegateQr))
    })

    expect(ref.getCurrentRoute()).toMatchObject({
      name: 'BurnScreen',
      params: delegateParams,
    })
  })

  it('opens the Home burn screen for a burn QR scanned on the Collectables stack', async () => {
    const ref = renderAt('Collectables', ['PaymentScreen'])

    await act(async () => {
      scan(JSON.stringify(burnQr))
    })

    expect(ref.getCurrentRoute()).toMatchObject({
      name: 'BurnScreen',
      params: burnQr,
    })
    expect(homeRoutes(ref)).toEqual([
      { name: 'AccountsScreen', params: undefined },
      { name: 'BurnScreen', params: burnQr },
    ])
  })

  it('opens the Home burn screen for a delegate QR scanned on the Collectables stack', async () => {
    const ref = renderAt('Collectables', ['PaymentScreen'])

    await act(async () => {
      scan(JSON.stringify(delegateQr))
    })

    expect(ref.getCurrentRoute()).toMatchObject({
      name: 'BurnScreen',
      params: delegateParams,
    })
  })

  it('opens a new Home burn screen over an open one for a delegate QR scanned on the Collectables stack', async () => {
    const delegateA = { ...delegateParams, address: 'delegate-a', amount: '1' }
    let keyA: string | undefined
    const ref = renderAt('Collectables', ['PaymentScreen'], (r) => {
      act(() => {
        r.navigate('TabBarNavigator', { screen: 'Home' })
      })
      act(() => {
        r.navigate('BurnScreen', delegateA)
      })
      keyA = r.getCurrentRoute()?.key
    })

    await act(async () => {
      scan(JSON.stringify(delegateQr))
    })

    expect(homeRoutes(ref)).toEqual([
      { name: 'AccountsScreen', params: undefined },
      { name: 'BurnScreen', params: delegateParams },
    ])
    expect(keyA).toBeDefined()
    expect(ref.getCurrentRoute()?.key).not.toBe(keyA)
  })

  it('replaces the Home burn screen the scanner opened from with a new burn screen', async () => {
    const ref = renderAt('Home', ['BurnScreen'])

    await act(async () => {
      scan(JSON.stringify(burnQr))
    })

    expect(homeRoutes(ref)).toEqual([
      { name: 'AccountsScreen', params: undefined },
      { name: 'BurnScreen', params: burnQr },
    ])
  })

  it('keeps the account screen under the burn screen when the scanner sits on it', async () => {
    const ref = renderAt('Home', [])

    await act(async () => {
      scan(JSON.stringify(burnQr))
    })

    expect(homeRoutes(ref)).toEqual([
      { name: 'AccountsScreen', params: undefined },
      { name: 'BurnScreen', params: burnQr },
    ])
    expect(ref.canGoBack()).toBe(true)
  })

  it('closes the Collectables payment screen when a burn QR opens the Home burn screen', async () => {
    const ref = renderAt('Collectables', ['PaymentScreen'])

    await act(async () => {
      scan(JSON.stringify(burnQr))
    })

    expect(tabStack(ref, 'Collectables')?.routes.map((r) => r.name)).toEqual([
      'CollectablesTopTab',
    ])
    expect(ref.getCurrentRoute()).toMatchObject({
      name: 'BurnScreen',
      params: burnQr,
    })
  })
})
