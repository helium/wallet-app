import type { PublicKey } from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TokenPill } from '../TokenPill'

// The node test runner cannot load react-native, lucide or uniwind. The host
// components and the press target render as named elements so the test reads
// their props.
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('lucide-react-native', () => ({ ChevronDown: 'ChevronDown' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../Text', () => ({ Text: 'Text' }))
jest.mock('../TokenIcon', () => ({ TokenIcon: 'TokenIcon' }))
jest.mock('../PressableScale', () => ({ PressableScale: 'PressableScale' }))
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({
    useMetaplexMetadata: () => ({
      symbol: 'HNT',
      json: { image: 'hnt.png' },
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

const mint = {} as PublicKey

describe('TokenPill', () => {
  it('renders the token icon and symbol and calls onPress', () => {
    const onPress = jest.fn()
    const renderer = create(<TokenPill mint={mint} onPress={onPress} />)

    act(() => {
      byType(renderer, 'PressableScale')[0].props.onPress()
    })

    expect(byType(renderer, 'TokenIcon')[0].props.img).toBe('hnt.png')
    expect(byType(renderer, 'Text')[0].props.children).toBe('HNT')
    expect(byType(renderer, 'ChevronDown')).toHaveLength(0)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('renders the token icon at the full 32pt height with no backdrop', () => {
    const renderer = create(<TokenPill mint={mint} onPress={jest.fn()} />)
    const icon = byType(renderer, 'TokenIcon')[0]

    expect(icon.props.size).toBe(32)
    const backdrops = byType(renderer, 'View').filter((view) =>
      /\bbg-/.test(view.props.className ?? ''),
    )
    expect(backdrops).toEqual([])
  })

  it('shows a chevron when hasCarot is set', () => {
    const renderer = create(
      <TokenPill mint={mint} hasCarot onPress={jest.fn()} />,
    )

    expect(byType(renderer, 'ChevronDown')).toHaveLength(1)
  })

  it('marks the active pill with the primary border', () => {
    const renderer = create(
      <TokenPill mint={mint} isActive onPress={jest.fn()} />,
    )

    expect(byType(renderer, 'PressableScale')[0].props.className).toContain(
      'border-primary',
    )
  })

  it('dims and disables the pill when isDisabled is set', () => {
    const renderer = create(
      <TokenPill mint={mint} isDisabled onPress={jest.fn()} />,
    )
    const pressable = byType(renderer, 'PressableScale')[0]

    expect(pressable.props.disabled).toBe(true)
    expect(byType(renderer, 'View')[0].props.className).toContain('opacity-50')
  })
})
