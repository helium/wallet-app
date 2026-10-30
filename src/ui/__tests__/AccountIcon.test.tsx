import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { AccountIcon } from '../AccountIcon'

// The node test runner cannot load react-native or react-native-svg. The host
// components render as named elements so the test reads their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-svg', () => ({ Svg: 'Svg', Rect: 'Rect' }))
jest.mock(
  '@utils/accountUtils',
  () => ({
    getJazzSeed: (address: string) => (address === 'none' ? undefined : 7),
  }),
  { virtual: true },
)
jest.mock(
  '@utils/jazzicon',
  () => ({
    jazzicon: (seed: number, size: number) => ({
      background: `#${seed}${size}`,
      shapes: [
        { fill: '#111', transform: 'rotate(1)' },
        { fill: '#222', transform: 'rotate(2)' },
      ],
    }),
  }),
  { virtual: true },
)

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

describe('AccountIcon', () => {
  it('draws the jazzicon for an address in a circle of the given size', () => {
    const { root } = create(<AccountIcon address="abc" size={76} />)
    const view = root.findByType('View' as unknown as React.ElementType)
    expect(view.props.style).toEqual({
      width: 76,
      height: 76,
      backgroundColor: '#776',
    })
    expect(view.props.className).toContain('rounded-full')
    const rects = root.findAllByType('Rect' as unknown as React.ElementType)
    expect(rects.map((r) => r.props.fill)).toEqual(['#111', '#222'])
    expect(rects[0].props.width).toBe(76)
  })

  it('renders nothing without an address or a seed', () => {
    expect(create(<AccountIcon size={40} />).toJSON()).toBeNull()
    expect(create(<AccountIcon address="none" size={40} />).toJSON()).toBeNull()
  })
})
