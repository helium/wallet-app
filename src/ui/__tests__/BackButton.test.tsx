import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BackButton } from '../BackButton'

// The node test runner cannot load react-native, lucide or uniwind. The host
// components and the press target render as named elements so the test reads
// their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('lucide-react-native', () => ({ ChevronLeft: 'ChevronLeft' }))
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

describe('BackButton', () => {
  it('renders a back chevron in a 44pt press target', () => {
    const renderer = create(<BackButton />)
    const [target] = byType(renderer, 'PressableScale')
    const [chevron] = byType(renderer, 'ChevronLeft')

    expect(target.props.className).toContain('size-11')
    expect(chevron.props.size).toBe(24)
  })

  it('calls onPress and passes the hit slop to the press target', () => {
    const onPress = jest.fn()
    const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 }
    const [target] = byType(
      create(<BackButton onPress={onPress} hitSlop={hitSlop} />),
      'PressableScale',
    )

    act(() => {
      target.props.onPress()
    })

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(target.props.hitSlop).toBe(hitSlop)
  })

  it('merges the caller className over the default padding', () => {
    const [wrapper] = byType(create(<BackButton className="px-0" />), 'View')

    expect(wrapper.props.className).toContain('px-0')
    expect(wrapper.props.className).not.toContain('px-7')
  })
})
