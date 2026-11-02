import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TokenIcon } from '../TokenIcon'

// The node test runner cannot load react-native. The host components render
// as named elements so the test reads their props.
jest.mock('../Image', () => ({ Image: 'Image' }))
jest.mock('react-native', () => ({ View: 'View' }))

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

describe('TokenIcon', () => {
  it('renders the token image as a circle of the given size', () => {
    const { root } = create(<TokenIcon size={32} img="https://x/icon.png" />)
    const image = root.findByType('Image' as unknown as React.ElementType)
    expect(image.props.source).toEqual({ uri: 'https://x/icon.png' })
    expect(image.props.style).toEqual({ width: 32, height: 32 })
    expect(image.props.className).toContain('rounded-full')
  })

  it('renders a 40pt placeholder circle when there is no image', () => {
    const { root } = create(<TokenIcon />)
    expect(root.findAllByType('Image' as unknown as React.ElementType)).toEqual(
      [],
    )
    const view = root.findByType('View' as unknown as React.ElementType)
    expect(view.props.style).toEqual({ width: 40, height: 40 })
    expect(view.props.className).toContain('bg-secondary')
  })
})
