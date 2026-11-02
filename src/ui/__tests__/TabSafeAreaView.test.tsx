import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TabSafeAreaView } from '../TabSafeAreaView'

// The node test runner cannot load react-native or react-native-screens. The
// host components render as named elements so the test reads their props.
jest.mock('react-native', () => ({
  StyleSheet: { create: <T,>(styles: T) => styles },
}))
jest.mock('react-native-screens/experimental', () => ({
  SafeAreaView: 'SafeAreaView',
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer.root.findByType(
    'SafeAreaView' as unknown as React.ElementType,
  ).props
}

describe('TabSafeAreaView', () => {
  it('pads every edge when no edges are given', () => {
    expect(render(<TabSafeAreaView />).edges).toEqual({
      top: true,
      right: true,
      bottom: true,
      left: true,
    })
  })

  it('pads only the edges it is given', () => {
    expect(render(<TabSafeAreaView edges={['bottom']} />).edges).toEqual({
      bottom: true,
    })
  })

  it('does not fill its parent unless its style says so', () => {
    expect(render(<TabSafeAreaView />).style).toEqual([{ flex: 0 }, undefined])
    expect(render(<TabSafeAreaView style={{ flex: 1 }} />).style).toEqual([
      { flex: 0 },
      { flex: 1 },
    ])
  })
})
