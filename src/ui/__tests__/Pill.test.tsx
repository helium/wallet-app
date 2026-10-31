import { Circle } from 'lucide-react-native'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { Pill } from '../Pill'

// The node test runner cannot load react-native, lucide or uniwind. The host
// components render as named elements so the test reads their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('lucide-react-native', () => ({ Circle: 'Circle' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../Text', () => ({ Text: 'Text' }))

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

describe('Pill', () => {
  it('renders the text in the colour classes and no glyph by default', () => {
    const renderer = create(<Pill color="success" text="Active" />)
    const [container] = byType(renderer, 'View')
    const [text] = byType(renderer, 'Text')

    expect(container.props.className).toContain('bg-success-50')
    expect(text.props.children).toBe('Active')
    expect(text.props.className).toContain('text-success-500')
    expect(byType(renderer, 'Circle')).toHaveLength(0)
  })

  it('renders the glyph at its size in the colour accent', () => {
    const renderer = create(<Pill color="destructive" Icon={Circle} />)
    const [icon] = byType(renderer, 'Circle')

    expect(icon.props.size).toBe(16)
    expect(icon.props.colorClassName).toBe('accent-destructive')
    expect(byType(renderer, 'Text')).toHaveLength(0)
  })

  it('lets the caller set the glyph colour, glyph size and text size', () => {
    const renderer = create(
      <Pill
        color="primary"
        text="Voted"
        Icon={Circle}
        iconSize={8}
        iconColorClassName="accent-warning-500"
        textSize="xs"
      />,
    )
    const [icon] = byType(renderer, 'Circle')

    expect(icon.props.size).toBe(8)
    expect(icon.props.colorClassName).toBe('accent-warning-500')
    expect(byType(renderer, 'Text')[0].props.size).toBe('xs')
  })

  it.each(['hnt', 'iot', 'mobile'] as const)(
    'renders the %s network colour with white text',
    (color) => {
      const renderer = create(<Pill color={color} text="Net" />)

      expect(byType(renderer, 'View')[0].props.className).toContain(
        `bg-${color}`,
      )
      expect(byType(renderer, 'Text')[0].props.className).toContain(
        'text-white',
      )
    },
  )
})
