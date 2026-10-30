import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Checkbox } from '../Checkbox'

// The node test runner cannot load react-native, lucide or uniwind. The host
// components render as named elements so the test reads their props.
jest.mock('react-native', () => ({ Pressable: 'Pressable' }))
jest.mock('lucide-react-native', () => ({ Check: 'Check' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

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

const pressable = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findByType('Pressable' as unknown as React.ElementType)

const checks = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType('Check' as unknown as React.ElementType)

describe('Checkbox', () => {
  it('renders an unchecked box with the checkbox role and no glyph', () => {
    const renderer = create(<Checkbox checked={false} onChange={jest.fn()} />)
    const box = pressable(renderer)

    expect(box.props.accessibilityRole).toBe('checkbox')
    expect(box.props.accessibilityState).toEqual({ checked: false })
    expect(box.props.className).toContain('border-input')
    expect(box.props.className).not.toContain('bg-primary')
    expect(checks(renderer)).toHaveLength(0)
  })

  it('renders a checked box with a primary fill and a 14px check', () => {
    const renderer = create(<Checkbox checked onChange={jest.fn()} />)
    const box = pressable(renderer)

    expect(box.props.accessibilityState).toEqual({ checked: true })
    expect(box.props.className).toContain('bg-primary')
    const [check] = checks(renderer)
    expect(check.props.size).toBe(14)
    expect(check.props.colorClassName).toBe('accent-primary-foreground')
  })

  it('calls onChange with the opposite state on press', () => {
    const onChange = jest.fn()
    const unchecked = create(<Checkbox checked={false} onChange={onChange} />)
    act(() => {
      pressable(unchecked).props.onPress()
    })
    expect(onChange).toHaveBeenLastCalledWith(true)

    const checked = create(<Checkbox checked onChange={onChange} />)
    act(() => {
      pressable(checked).props.onPress()
    })
    expect(onChange).toHaveBeenLastCalledWith(false)
  })

  it('passes the caller className and testID through', () => {
    const box = pressable(
      create(
        <Checkbox
          checked={false}
          onChange={jest.fn()}
          className="mr-4"
          testID="cb"
        />,
      ),
    )

    expect(box.props.className).toContain('mr-4')
    expect(box.props.testID).toBe('cb')
  })
})
