import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { MessagePreview } from '../MessagePreview'

jest.mock('@ui/Card', () => ({ Card: 'Card' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const texts = (element: React.ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(element)
  })
  if (!renderer) throw new Error('render failed')
  return renderer.root
    .findAllByType('Text' as never)
    .map((n) => n.props.children)
}

describe('MessagePreview', () => {
  it('shows a non-empty message and warning', () => {
    expect(
      texts(<MessagePreview message="Sign in" warning="Unknown site" />),
    ).toEqual(['Sign in', 'Unknown site'])
  })

  it('shows nothing for an empty message and warning', () => {
    expect(texts(<MessagePreview message="" warning="" />)).toEqual([])
  })
})
