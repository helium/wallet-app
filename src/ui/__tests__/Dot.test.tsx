import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Dot } from '../Dot'

// The node test runner cannot load react-native. View renders as a named
// element so the test reads its props.
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
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

const byType = (renderer: TestRenderer.ReactTestRenderer, type: string) =>
  renderer.root.findAllByType(type as unknown as React.ElementType)

const dot = (element: React.ReactElement) => byType(create(element), 'View')[0]

describe('Dot', () => {
  it('renders an empty muted ring at 16pt by default', () => {
    const view = dot(<Dot />)

    expect(view.props.style).toEqual({ width: 16, height: 16 })
    expect(view.props.className).toContain('border-muted-foreground')
    expect(view.props.className).not.toContain('bg-')
  })

  it('fills in purple by default', () => {
    expect(dot(<Dot filled />).props.className).toContain('bg-purple-500')
  })

  it('fills in the given colour at the given size', () => {
    const view = dot(<Dot filled color="success" size={8} />)

    expect(view.props.className).toContain('bg-success-500')
    expect(view.props.style).toEqual({ width: 8, height: 8 })
  })
})
