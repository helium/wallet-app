import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { CardSkeleton } from '../CardSkeleton'

// The node test runner cannot load react-native or reanimated. The host
// components render as named elements so the test reads their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' },
}))
jest.mock('@theme/motion', () => ({ FADE_IN: 'in', FADE_OUT: 'out' }), {
  virtual: true,
})
jest.mock('../Spinner', () => ({ Spinner: 'Spinner' }))

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

describe('CardSkeleton', () => {
  it('fades a card of the given height with a spinner in and out', () => {
    const renderer = create(<CardSkeleton height={120} />)
    const [animated] = byType(renderer, 'AnimatedView')
    const [card] = byType(renderer, 'View')

    expect(animated.props.entering).toBe('in')
    expect(animated.props.exiting).toBe('out')
    expect(card.props.style).toEqual({ height: 120 })
    expect(card.props.className).toContain('bg-secondary')
    expect(byType(renderer, 'Spinner')).toHaveLength(1)
  })
})
