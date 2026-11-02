import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TabSafeAreaView } from '../TabSafeAreaView'

// The node test runner cannot load react-native or react-native-screens. The
// host components render as named elements so the test reads their props.
jest.mock('react-native', () => ({
  View: 'View',
  StyleSheet: {
    create: <T,>(styles: T) => styles,
    flatten: (style: unknown): object | undefined =>
      Array.isArray(style)
        ? Object.assign({}, ...style.map((s) => s ?? {}))
        : (style as object | undefined),
  },
}))
jest.mock('react-native-screens/experimental', () => ({
  SafeAreaView: 'SafeAreaView',
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const create = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  const find = (type: string) =>
    renderer.root.findByType(type as unknown as React.ElementType).props
  return { outer: find('View'), inner: find('SafeAreaView') }
}

// The flattened style of a host element.
const styleOf = (props: { [prop: string]: unknown }) =>
  Object.assign({}, ...(props.style as object[]))

describe('TabSafeAreaView', () => {
  it('pads every edge when no edges are given', () => {
    expect(create(<TabSafeAreaView />).inner.edges).toEqual({
      top: true,
      right: true,
      bottom: true,
      left: true,
    })
  })

  it('pads only the edges it is given', () => {
    expect(create(<TabSafeAreaView edges={['bottom']} />).inner.edges).toEqual({
      bottom: true,
    })
  })

  it('puts the sizing, margin and background on the outer view and the layout on the inner one', () => {
    const { outer, inner } = create(
      <TabSafeAreaView
        style={{
          flex: 1,
          backgroundColor: 'red',
          marginTop: 4,
          padding: 8,
          alignItems: 'center',
          flexDirection: 'row',
        }}
      />,
    )

    expect(styleOf(outer)).toEqual({
      flex: 1,
      backgroundColor: 'red',
      marginTop: 4,
    })
    expect(styleOf(inner)).toEqual({
      padding: 8,
      alignItems: 'center',
      flexDirection: 'row',
      flex: 0,
      flexGrow: 1,
      flexShrink: 1,
    })
  })

  it('passes the other props to the outer view', () => {
    const { outer, inner } = create(<TabSafeAreaView testID="footer" />)

    expect(outer.testID).toBe('footer')
    expect(inner.testID).toBeUndefined()
  })

  it('overrides the flex: 1 that the screens SafeAreaView puts first, so the children keep their size', () => {
    const { inner } = create(<TabSafeAreaView />)
    // The screens SafeAreaView renders style={[{ flex: 1 }, props.style]}.
    const resolved = styleOf({ style: [{ flex: 1 }, ...inner.style] })

    expect(resolved.flex).toBe(0)
    expect(resolved.flexGrow).toBe(1)
  })

  it('does not fill its parent unless its style says so', () => {
    expect(styleOf(create(<TabSafeAreaView />).outer)).toEqual({ flex: 0 })
  })
})
