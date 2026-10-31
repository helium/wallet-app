import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { RootStatusBar } from '../RootStatusBar'

// The node test runner cannot load react-native. StatusBar renders as a named
// element so the test reads its props.
jest.mock('react-native', () => ({ StatusBar: 'StatusBar' }))

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('RootStatusBar', () => {
  it('draws dark glyphs for the light app background', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<RootStatusBar />)
    })
    const bar = renderer.root.findByType(
      'StatusBar' as unknown as React.ElementType,
    )

    expect(bar.props.barStyle).toBe('dark-content')
  })
})
