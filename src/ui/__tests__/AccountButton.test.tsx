import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { AccountButton } from '../AccountButton'

const mockDismissKeyboard = jest.fn()

// The node test runner cannot load react-native, lucide or uniwind. The host
// components and the press target render as named elements so the test reads
// their props.
jest.mock('react-native', () => ({
  View: 'View',
  Keyboard: { dismiss: () => mockDismissKeyboard() },
}))
jest.mock('lucide-react-native', () => ({ ChevronDown: 'ChevronDown' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../Text', () => ({ Text: 'Text' }))
jest.mock('../AccountIcon', () => ({ AccountIcon: 'AccountIcon' }))
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

beforeEach(() => mockDismissKeyboard.mockClear())

describe('AccountButton', () => {
  it('shows the account icon, subtitle, title and a chevron', () => {
    const renderer = create(
      <AccountButton address="addr" title="Main" subtitle="Sender" />,
    )
    const [icon] = byType(renderer, 'AccountIcon')
    const texts = byType(renderer, 'Text').map((t) => t.props.children)

    expect(icon.props).toEqual({ size: 28, address: 'addr' })
    expect(texts).toEqual(['Sender', 'Main'])
    expect(byType(renderer, 'ChevronDown')).toHaveLength(1)
  })

  it('hides the chevron and sizes the icon on request', () => {
    const renderer = create(
      <AccountButton
        address="addr"
        title="Main"
        showChevron={false}
        accountIconSize={41}
      />,
    )
    expect(byType(renderer, 'AccountIcon')[0].props.size).toBe(41)
    expect(byType(renderer, 'ChevronDown')).toHaveLength(0)
  })

  it('dismisses the keyboard and reports the address on press', () => {
    const onPress = jest.fn()
    const [button] = byType(
      create(<AccountButton address="addr" title="Main" onPress={onPress} />),
      'PressableScale',
    )

    expect(button.props.disabled).toBe(false)
    act(() => {
      button.props.onPress()
    })
    expect(mockDismissKeyboard).toHaveBeenCalledTimes(1)
    expect(onPress).toHaveBeenCalledWith('addr')
  })

  it('is disabled without an onPress', () => {
    const [button] = byType(
      create(<AccountButton address="addr" title="Main" />),
      'PressableScale',
    )
    expect(button.props.disabled).toBe(true)
  })

  it('applies className to the button and the background to the bubble', () => {
    const renderer = create(
      <AccountButton
        title="Main"
        className="mx-6 mt-6"
        backgroundClassName="bg-secondary"
        showBubbleArrow
      />,
    )
    const [button] = byType(renderer, 'PressableScale')
    const filled = byType(renderer, 'View').filter((v) =>
      String(v.props.className).includes('bg-secondary'),
    )

    expect(button.props.className).toContain('mx-6 mt-6')
    // The pill and the bubble arrow under it.
    expect(filled).toHaveLength(2)
  })

  it('draws no bubble arrow by default', () => {
    const renderer = create(
      <AccountButton title="Main" backgroundClassName="bg-secondary" />,
    )
    const filled = byType(renderer, 'View').filter((v) =>
      String(v.props.className).includes('bg-secondary'),
    )
    expect(filled).toHaveLength(1)
  })
})
