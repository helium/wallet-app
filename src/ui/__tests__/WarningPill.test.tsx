import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { WarningPill } from '../WarningPill'

// The node test runner cannot load lucide. Pill renders as a named element so
// the test reads its props.
jest.mock('lucide-react-native', () => ({ TriangleAlert: 'TriangleAlert' }))
jest.mock('../Pill', () => ({ Pill: 'Pill' }))

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

describe('WarningPill', () => {
  it('renders a destructive pill with an alert glyph for critical', () => {
    const [pill] = byType(
      create(<WarningPill text="Fails" variant="critical" />),
      'Pill',
    )

    expect(pill.props.color).toBe('destructive')
    expect(pill.props.text).toBe('Fails')
    expect(pill.props.Icon).toBe('TriangleAlert')
  })

  it('renders a warning pill for warning', () => {
    const [pill] = byType(
      create(<WarningPill text="Check" variant="warning" />),
      'Pill',
    )

    expect(pill.props.color).toBe('warning')
  })
})
