import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { FocusAwareStatusBar } from '../FocusAwareStatusBar'

let mockFocused = true

// The node test runner cannot load react-native. StatusBar renders as a named
// element so the test reads its props.
jest.mock('react-native', () => ({ StatusBar: 'StatusBar' }))
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockFocused,
}))

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = () => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <FocusAwareStatusBar barStyle="light-content" />,
    )
  })
  return renderer
}

const statusBars = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType('StatusBar' as unknown as React.ElementType)

describe('FocusAwareStatusBar', () => {
  it('renders the status bar with its props while the screen has focus', () => {
    mockFocused = true
    const [bar] = statusBars(render())

    expect(bar.props.barStyle).toBe('light-content')
  })

  it('renders nothing while the screen is out of focus', () => {
    mockFocused = false

    expect(statusBars(render())).toHaveLength(0)
  })
})
