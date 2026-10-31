import type { PublicKey } from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TokenButton } from '../TokenButton'

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
jest.mock('../TokenIcon', () => ({ TokenIcon: 'TokenIcon' }))
jest.mock('../PressableScale', () => ({ PressableScale: 'PressableScale' }))
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({
    useMetaplexMetadata: (mint?: { name: string }) => ({
      json: mint ? { image: `${mint.name}.png` } : undefined,
    }),
  }),
  { virtual: true },
)

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

const hnt = { name: 'hnt' } as unknown as PublicKey

beforeEach(() => mockDismissKeyboard.mockClear())

describe('TokenButton', () => {
  it('shows the token image, title, subtitle and a chevron', () => {
    const renderer = create(
      <TokenButton mint={hnt} title="Send HNT" subtitle="12 HNT" />,
    )
    const [icon] = byType(renderer, 'TokenIcon')
    const texts = byType(renderer, 'Text').map((t) => t.props.children)

    expect(icon.props).toEqual({ img: 'hnt.png', size: 41 })
    expect(texts).toEqual(['Send HNT', '12 HNT'])
    expect(byType(renderer, 'ChevronDown')).toHaveLength(1)
  })

  it('dismisses the keyboard and reports the address on press', () => {
    const onPress = jest.fn()
    const [button] = byType(
      create(<TokenButton address="addr" title="HNT" onPress={onPress} />),
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
      create(<TokenButton title="HNT" />),
      'PressableScale',
    )
    expect(button.props.disabled).toBe(true)
  })

  it('applies className to the button and the background to the bubble', () => {
    const renderer = create(
      <TokenButton
        title="HNT"
        className="mx-6"
        backgroundClassName="bg-secondary"
        showBubbleArrow
      />,
    )
    const [button] = byType(renderer, 'PressableScale')
    const filled = byType(renderer, 'View').filter((v) =>
      String(v.props.className).includes('bg-secondary'),
    )

    expect(button.props.className).toContain('mx-6')
    // The pill and the bubble arrow under it.
    expect(filled).toHaveLength(2)
  })
})
