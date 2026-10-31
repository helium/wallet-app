import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TouchableContainer } from '../TouchableContainer'

const mockTriggerImpact = jest.fn()
let mockPressed = false

jest.mock(
  '@hooks/useHaptic',
  () => () => ({ triggerImpact: mockTriggerImpact }),
  { virtual: true },
)

// The node test runner cannot load react-native. The host components render
// as named elements so the test reads their props. Pressable calls a render
// function child with `mockPressed`, as the real one does with its state.
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  return {
    View: 'View',
    Pressable: ({
      children,
      ...props
    }: {
      children: React.ReactNode | ((s: { pressed: boolean }) => unknown)
    }) =>
      ReactActual.createElement(
        'Pressable',
        props,
        typeof children === 'function'
          ? children({ pressed: mockPressed })
          : children,
      ),
  }
})

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

const host = (renderer: TestRenderer.ReactTestRenderer, type: string) =>
  renderer.root.findByType(type as unknown as React.ElementType)

beforeEach(() => {
  mockPressed = false
  mockTriggerImpact.mockClear()
})

describe('TouchableContainer', () => {
  it('fires a light haptic and the onPress on press', () => {
    const onPress = jest.fn()
    const renderer = create(
      <TouchableContainer onPress={onPress} testID="row">
        child
      </TouchableContainer>,
    )
    const pressable = host(renderer, 'Pressable')
    expect(pressable.props.testID).toBe('row')

    act(() => {
      pressable.props.onPress('event')
    })
    expect(mockTriggerImpact).toHaveBeenCalledWith('light')
    expect(onPress).toHaveBeenCalledWith('event')
  })

  it('passes disabled to the press target', () => {
    const renderer = create(
      <TouchableContainer disabled onPress={jest.fn()}>
        child
      </TouchableContainer>,
    )
    expect(host(renderer, 'Pressable').props.disabled).toBe(true)
  })

  it('shows a secondary background that changes while pressed', () => {
    const idle = host(
      create(<TouchableContainer className="p-4">child</TouchableContainer>),
      'View',
    )
    expect(idle.props.className).toContain('bg-secondary')
    expect(idle.props.className).toContain('p-4')
    expect(idle.props.children).toBe('child')

    mockPressed = true
    const pressed = host(
      create(<TouchableContainer>child</TouchableContainer>),
      'View',
    )
    expect(pressed.props.className).toContain('bg-accent')
    expect(pressed.props.className).not.toContain('bg-secondary')
  })

  it('shows no background without a pressed state', () => {
    mockPressed = true
    const view = host(
      create(
        <TouchableContainer hasPressedState={false}>child</TouchableContainer>,
      ),
      'View',
    )
    expect(view.props.className).not.toMatch(/\bbg-/)
  })
})
