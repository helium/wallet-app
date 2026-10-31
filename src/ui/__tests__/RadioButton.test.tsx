import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { RadioButton } from '../RadioButton'

// The node test runner cannot load react-native. The host components render
// as named elements so the test reads their props.
jest.mock('react-native', () => ({ Pressable: 'Pressable', View: 'View' }))

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

const dots = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findAllByType('View' as unknown as React.ElementType)

describe('RadioButton', () => {
  it('renders an unselected round 16px radio with an input border and no dot', () => {
    const renderer = create(
      <RadioButton selected={false} onSelect={jest.fn()} />,
    )
    const radio = pressable(renderer)

    expect(radio.props.accessibilityRole).toBe('radio')
    expect(radio.props.accessibilityState).toEqual({ checked: false })
    expect(radio.props.className).toContain('size-4')
    expect(radio.props.className).toContain('rounded-full')
    expect(radio.props.className).toContain('border-input')
    expect(dots(renderer)).toHaveLength(0)
  })

  it('renders a selected radio with a primary border and an 8px primary dot', () => {
    const renderer = create(<RadioButton selected onSelect={jest.fn()} />)
    const radio = pressable(renderer)

    expect(radio.props.accessibilityState).toEqual({ checked: true })
    expect(radio.props.className).toContain('border-primary')
    const [dot] = dots(renderer)
    expect(dot.props.className).toContain('size-2')
    expect(dot.props.className).toContain('bg-primary')
  })

  it('calls onSelect on press', () => {
    const onSelect = jest.fn()
    const renderer = create(
      <RadioButton selected={false} onSelect={onSelect} />,
    )
    act(() => {
      pressable(renderer).props.onPress()
    })
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('passes the caller className and accessibility props through', () => {
    const radio = pressable(
      create(
        <RadioButton
          selected={false}
          onSelect={jest.fn()}
          className="mt-1"
          accessible={false}
        />,
      ),
    )

    expect(radio.props.className).toContain('mt-1')
    expect(radio.props.accessible).toBe(false)
  })
})
