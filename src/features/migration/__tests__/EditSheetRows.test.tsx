import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import HotspotsEditSheet from '../components/HotspotsEditSheet'
import TokensEditSheet from '../components/TokensEditSheet'

jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
jest.mock('@gorhom/bottom-sheet', () => {
  const ReactActual = jest.requireActual('react')
  return {
    BottomSheetFlatList: ({
      data,
      renderItem,
      keyExtractor,
    }: {
      data: unknown[]
      renderItem: (info: { item: unknown }) => React.ReactElement
      keyExtractor: (item: unknown) => string
    }) =>
      data.map((item) =>
        ReactActual.createElement(
          ReactActual.Fragment,
          { key: keyExtractor(item) },
          renderItem({ item }),
        ),
      ),
  }
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({}) }),
  { virtual: true },
)
jest.mock('@hooks/usePublicKey', () => ({ usePublicKey: (k: string) => k }), {
  virtual: true,
})
jest.mock(
  '@ui/Sheet',
  () => ({
    Sheet: ({ children }: { children: React.ReactNode }) => children,
  }),
  { virtual: true },
)
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/TokenIcon', () => ({ TokenIcon: 'TokenIcon' }), {
  virtual: true,
})
jest.mock('@ui/Checkbox', () => ({ Checkbox: 'Checkbox' }), { virtual: true })
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = (element: React.ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(element)
  })
  if (!renderer) throw new Error('render failed')
  return renderer.root
}

describe('HotspotsEditSheet', () => {
  it('gives each row checkbox semantics and hides the inner checkbox', () => {
    const onToggle = jest.fn()
    const root = render(
      <HotspotsEditSheet
        hotspots={[
          { entityKey: 'a', name: 'A', type: 'IOT', deviceType: 'x' },
          { entityKey: 'b', name: 'B', type: 'MOBILE', deviceType: 'y' },
        ]}
        selected={new Set(['a'])}
        onToggle={onToggle}
      />,
    )

    const rows = root.findAllByType('PressableScale' as never)
    expect(rows.map((r) => r.props.accessibilityRole)).toEqual([
      'checkbox',
      'checkbox',
    ])
    expect(rows.map((r) => r.props.accessibilityState)).toEqual([
      { checked: true },
      { checked: false },
    ])
    expect(
      root.findAllByType('Checkbox' as never).map((c) => c.props.accessible),
    ).toEqual([false, false])

    act(() => {
      rows[1].props.onPress()
    })
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith('b')
  })

  it('keeps the row renderer and key extractor when the sheet re-renders', () => {
    const hotspots = [
      { entityKey: 'a', name: 'A', type: 'IOT', deviceType: 'x' },
    ]
    const selected = new Set(['a'])
    const onToggle = jest.fn()
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <HotspotsEditSheet
          hotspots={hotspots}
          selected={selected}
          onToggle={onToggle}
        />,
      )
    })
    const before = renderer.root.findByType(BottomSheetFlatList).props
    act(() => {
      renderer.update(
        <HotspotsEditSheet
          hotspots={hotspots}
          selected={selected}
          onToggle={onToggle}
        />,
      )
    })
    const after = renderer.root.findByType(BottomSheetFlatList).props

    expect(after.renderItem).toBe(before.renderItem)
    expect(after.keyExtractor).toBe(before.keyExtractor)
  })
})

describe('TokensEditSheet', () => {
  it('gives a non-SOL row checkbox semantics and hides the inner checkbox', () => {
    const mint = 'NotWrappedSol1111111111111111111111111111111'
    const root = render(
      <TokensEditSheet
        tokens={[{ mint, label: 'TKN', decimals: 6, maxUi: '5' }]}
        amounts={{ [mint]: '5' }}
        onCommit={() => {}}
      />,
    )

    const [row] = root.findAllByType('PressableScale' as never)
    expect(row.props.accessibilityRole).toBe('checkbox')
    expect(row.props.accessibilityState).toEqual({ checked: true })
    const [checkbox] = root.findAllByType('Checkbox' as never)
    expect(checkbox.props.accessible).toBe(false)
  })

  it('renders the token rows in a virtualized list', () => {
    const tokens = ['MintA', 'MintB', 'MintC'].map((mint) => ({
      mint,
      label: mint,
      decimals: 6,
      maxUi: '1',
    }))
    const root = render(
      <TokensEditSheet tokens={tokens} amounts={{}} onCommit={() => {}} />,
    )

    expect(root.findByType(BottomSheetFlatList).props.data).toEqual(tokens)
    expect(root.findAllByType('PressableScale' as never)).toHaveLength(3)
  })
})
