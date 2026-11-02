import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { CloseButton } from '../CloseButton'

// The node test runner cannot load react-native, lucide or uniwind. The host
// components and the press target render as named elements so the test reads
// their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('lucide-react-native', () => ({ X: 'X' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../PressableScale', () => ({ PressableScale: 'PressableScale' }))

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

describe('CloseButton', () => {
  it('puts the testID on the press target and calls onPress', () => {
    const onPress = jest.fn()
    const renderer = create(<CloseButton testID="Close" onPress={onPress} />)
    const [target] = byType(renderer, 'PressableScale')

    act(() => {
      target.props.onPress()
    })

    expect(target.props.testID).toBe('Close')
    expect(target.props.className).toContain('size-11')
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(byType(renderer, 'X')[0].props.size).toBe(24)
  })

  it('puts the accessibility label on the press target', () => {
    const [target] = byType(
      create(<CloseButton accessibilityLabel="Close" />),
      'PressableScale',
    )

    expect(target.props.accessibilityLabel).toBe('Close')
  })

  it('passes the caller className to the wrapper', () => {
    const [wrapper] = byType(create(<CloseButton className="ms-4" />), 'View')

    expect(wrapper.props.className).toBe('ms-4')
  })
})
