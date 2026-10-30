import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Spinner } from '../Spinner'

// The node test runner cannot load react-native. The host component renders
// as a named element so the test reads its props.
jest.mock('react-native', () => ({ ActivityIndicator: 'ActivityIndicator' }))

const render = (element: React.ReactElement) =>
  create(element).root.findByType(
    'ActivityIndicator' as unknown as React.ElementType,
  ).props

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const create = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer
}

describe('Spinner', () => {
  it('colours the indicator World purple by default', () => {
    expect(render(<Spinner />).colorClassName).toBe('accent-purple-700')
  })

  it('takes a colour class and passes other props through', () => {
    const props = render(
      <Spinner colorClassName="accent-foreground" size="large" testID="s" />,
    )
    expect(props.colorClassName).toBe('accent-foreground')
    expect(props.size).toBe('large')
    expect(props.testID).toBe('s')
  })
})
