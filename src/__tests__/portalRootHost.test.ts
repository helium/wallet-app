import fs from 'fs'
import path from 'path'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Portal, PortalHost, PortalProvider } from '@gorhom/portal'
import { RootPortal, RootPortalProvider } from '../ui/RootPortal'

// @gorhom/bottom-sheet wraps BottomSheetModalProvider's children in
// <PortalProvider rootHostName="bottom-sheet-portal-N">. A default <Portal>
// registers with the nearest such provider, which has no 'root' host, so it
// renders nothing. App's screens sit below several of them: KeystoneModal,
// WalletSignBottomSheet and ConnectedWallets each add one.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const h = React.createElement

const render = (element: React.ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer?.toJSON()
}

const bottomSheetProvider = (id: number, children: React.ReactNode) =>
  h(PortalProvider, { rootHostName: `bottom-sheet-portal-${id}`, children })

// The old shape: App's PortalProvider, App's BottomSheetModalProvider with a
// 'root' host, then a nested BottomSheetModalProvider above the screen.
const outerHostTree = (screen: React.ReactNode) =>
  h(PortalProvider, {
    children: bottomSheetProvider(1, [
      h(React.Fragment, { key: 'nested' }, bottomSheetProvider(8, screen)),
      h(PortalHost, { key: 'host', name: 'root' }),
    ]),
  })

// App's shape: RootPortalProvider sits below App's nested providers and
// wraps the navigator, which adds more of them above the screens.
const appTree = (screen: React.ReactNode) =>
  h(PortalProvider, {
    children: bottomSheetProvider(
      1,
      bottomSheetProvider(
        2,
        h(RootPortalProvider, {
          children: bottomSheetProvider(8, screen),
        }),
      ),
    ),
  })

describe('default Portal under a nested BottomSheetModalProvider', () => {
  it("renders nothing, even with a 'root' host in an outer provider", () => {
    expect(render(outerHostTree(h(Portal, null, h('Sheet'))))).toBeNull()
  })
})

describe('RootPortal', () => {
  it('renders at the RootPortalProvider host from under nested providers', () => {
    expect(render(appTree(h(RootPortal, null, h('Sheet'))))).toEqual({
      type: 'Sheet',
      props: {},
      children: null,
    })
  })

  it('renders after the screens, so it draws above them', () => {
    expect(
      render(
        appTree([
          h(RootPortal, { key: 'portal', children: h('Sheet') }),
          h('Screen', { key: 'screen' }),
        ]),
      ),
    ).toEqual([
      { type: 'Screen', props: {}, children: null },
      { type: 'Sheet', props: {}, children: null },
    ])
  })

  it('removes its content on unmount', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(appTree(h(RootPortal, null, h('Sheet'))))
    })
    act(() => renderer?.update(appTree(null)))
    expect(renderer?.toJSON()).toBeNull()
  })

  it('throws without a RootPortalProvider instead of rendering nothing', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(bottomSheetProvider(8, h(RootPortal, null, h('Sheet')))),
    ).toThrow('RootPortal needs a RootPortalProvider above it')
  })

  // Structural: App.tsx cannot render under jest's node environment, so this
  // checks that RootPortalProvider wraps the navigator inside every app
  // provider, and that App adds no 'root' host of its own.
  it('App.tsx wraps the navigator in one RootPortalProvider inside PrivyAppProvider', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'App.tsx'),
      'utf8',
    )
    const privy = source.match(
      /<PrivyAppProvider>([\s\S]*)<\/PrivyAppProvider>/,
    )?.[1]
    expect(privy).toMatch(
      /<RootPortalProvider>[\s\S]*<RootNavigator \/>[\s\S]*<\/RootPortalProvider>/,
    )
    expect(source.match(/<RootPortalProvider>/g)).toHaveLength(1)
    expect(source).not.toMatch(/<PortalHost name="root"/)
  })
})
