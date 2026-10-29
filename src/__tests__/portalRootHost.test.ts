import fs from 'fs'
import path from 'path'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Portal, PortalHost, PortalProvider } from '@gorhom/portal'

// @gorhom/bottom-sheet wraps BottomSheetModalProvider's children in
// <PortalProvider rootHostName="bottom-sheet-portal-N">. A default <Portal>
// below it registers with that provider, which has no 'root' host, so
// HNTKeyboard, BlurActionSheet and SolanaMigration render nothing unless App
// adds a 'root' host inside BottomSheetModalProvider.
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

// The shape of App's tree: App's PortalProvider, then the provider that
// BottomSheetModalProvider adds around its children.
const appTree = (bottomSheetChildren: React.ReactNode) =>
  h(PortalProvider, {
    children: h(PortalProvider, {
      rootHostName: 'bottom-sheet-portal-1',
      children: bottomSheetChildren,
    }),
  })

describe('default-host Portal under BottomSheetModalProvider', () => {
  it('renders nothing without a root host inside the bottom sheet provider', () => {
    expect(render(appTree(h(Portal, null, h('Sheet'))))).toBeNull()
  })

  it('renders into a root host placed inside the bottom sheet provider', () => {
    expect(
      render(
        appTree([
          h(Portal, { key: 'portal' }, h('Sheet')),
          h(PortalHost, { key: 'host', name: 'root' }),
        ]),
      ),
    ).toEqual({ type: 'Sheet', props: {}, children: null })
  })

  // Structural: App.tsx cannot render under jest's node environment, so this
  // checks that App puts the root host where the cases above need it.
  it('App.tsx puts a root PortalHost inside BottomSheetModalProvider', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'App.tsx'),
      'utf8',
    )
    const inside = source.match(
      /<BottomSheetModalProvider>([\s\S]*)<\/BottomSheetModalProvider>/,
    )?.[1]
    expect(inside).toMatch(/<PortalHost name="root" \/>/)
  })
})
