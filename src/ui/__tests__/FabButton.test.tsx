import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { FabButton } from '../FabButton'

jest.mock('@utils/layout', () => ({ getMaxFontSizeMultiplier: () => 1.5 }), {
  virtual: true,
})
jest.mock('../PressableScale', () => ({ PressableScale: 'PressableScale' }))
// The node test runner cannot load react-native, lucide or uniwind. Host
// components and glyphs render as named elements so the test reads their
// props.
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  useWindowDimensions: () => ({ width: 390, height: 844 }),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  ArrowDown: 'ArrowDown',
  ArrowLeftRight: 'ArrowLeftRight',
  ArrowUp: 'ArrowUp',
  ChevronRight: 'ChevronRight',
  Droplet: 'Droplet',
  Ellipsis: 'Ellipsis',
}))

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer
}

const byType = (renderer: TestRenderer.ReactTestRenderer, type: string) =>
  renderer.root.findAllByType(type as unknown as React.ElementType)

const button = (renderer: TestRenderer.ReactTestRenderer) =>
  byType(renderer, 'PressableScale')[0]

describe('FabButton', () => {
  it('renders a round button with the glyph in the tone colour', () => {
    const renderer = render(<FabButton icon="swaps" tone="warning" />)

    expect(button(renderer).props.className).toContain('rounded-full')
    expect(button(renderer).props.className).toContain('bg-warning-500/20')
    const [glyph] = byType(renderer, 'ArrowLeftRight')
    expect(glyph.props.colorClassName).toBe('accent-warning-500')
    expect(byType(renderer, 'Text')).toHaveLength(0)
  })

  it.each([
    ['fatArrowUp', 'ArrowUp'],
    ['fatArrowDown', 'ArrowDown'],
    ['arrowRight', 'ChevronRight'],
    ['airdrop', 'Droplet'],
  ] as const)('renders %s as the lucide %s glyph', (icon, glyph) => {
    expect(
      byType(render(<FabButton icon={icon} tone="info" />), glyph),
    ).toHaveLength(1)
  })

  it('shows the dots glyph when a round button has no icon', () => {
    expect(byType(render(<FabButton tone="info" />), 'Ellipsis')).toHaveLength(
      1,
    )
  })

  it('renders a titled pill with the glyph before the title', () => {
    const renderer = render(
      <FabButton icon="fatArrowDown" tone="success" title="Deposit" />,
    )
    const pill = button(renderer)

    expect(pill.props.className).toContain('flex-row')
    expect(pill.props.className).not.toContain('flex-row-reverse')
    const [title] = byType(renderer, 'Text')
    expect(title.props.children).toBe('Deposit')
    expect(title.props.className).toContain('text-success-500')
    expect(byType(renderer, 'ArrowDown')).toHaveLength(1)
  })

  it('puts the glyph after the title when reversed', () => {
    const pill = button(
      render(<FabButton icon="fatArrowUp" tone="info" title="Send" reverse />),
    )

    expect(pill.props.className).toContain('flex-row-reverse')
  })

  it('renders a titled pill without a glyph when it has no icon', () => {
    const renderer = render(<FabButton tone="info" title="Delegate" />)

    expect(byType(renderer, 'Ellipsis')).toHaveLength(0)
  })

  it('passes the press handler, testID and disabled state through', () => {
    const onPress = jest.fn()
    const target = button(
      render(
        <FabButton
          icon="fatArrowUp"
          tone="info"
          testID="AccountActionBar.Send"
          onPress={onPress}
          disabled
        />,
      ),
    )

    act(() => {
      target.props.onPress()
    })
    expect(onPress).toHaveBeenCalled()
    expect(target.props.testID).toBe('AccountActionBar.Send')
    expect(target.props.disabled).toBe(true)
  })

  it('lets the caller className override the size', () => {
    const { className } = button(
      render(<FabButton tone="info" className="size-12" />),
    ).props

    expect(className).toContain('size-12')
    expect(className).not.toContain('size-14')
  })
})
