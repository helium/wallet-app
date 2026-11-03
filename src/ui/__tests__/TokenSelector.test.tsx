import type { PublicKey } from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import {
  TokenSelector,
  type TokenListItem,
  type TokenSelectorRef,
} from '../TokenSelector'

// The node test runner cannot load gorhom (Reanimated) or react-native. The
// sheet renders its content only while presented, and the list renders one
// row per item.
const mockRenderItems: unknown[] = []

jest.mock('../TabSafeAreaView', () => ({
  TabSafeAreaView: 'TabSafeAreaView',
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 20 }),
}))
jest.mock('@gorhom/bottom-sheet', () => {
  const ReactActual = jest.requireActual('react')
  return {
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    BottomSheetFlatList: ({
      data,
      renderItem,
      keyExtractor,
    }: {
      data: unknown[]
      renderItem: (info: { item: unknown }) => React.ReactNode
      keyExtractor: (item: unknown) => string
    }) => {
      mockRenderItems.push(renderItem)
      return data.map((item) =>
        ReactActual.createElement(
          ReactActual.Fragment,
          { key: keyExtractor(item) },
          renderItem({ item }),
        ),
      )
    },
  }
})
jest.mock('../Sheet', () => {
  const ReactActual = jest.requireActual('react')
  return {
    Sheet: ({
      ref,
      children,
      ...props
    }: {
      ref: React.Ref<unknown>
      children: React.ReactNode
    }) => {
      const [open, setOpen] = ReactActual.useState(false)
      ReactActual.useImperativeHandle(ref, () => ({
        present: () => setOpen(true),
        dismiss: () => setOpen(false),
      }))
      return open ? ReactActual.createElement('Sheet', props, children) : null
    },
  }
})
jest.mock('../ContentColumn', () => ({ useSheetMargins: () => undefined }))
jest.mock('../ListItem', () => ({ LIST_ITEM_HEIGHT: 70, ListItem: 'ListItem' }))
jest.mock('../TokenIcon', () => ({ TokenIcon: 'TokenIcon' }))
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({
    useMetaplexMetadata: (mint: { name: string }) => ({
      symbol: mint.name.toUpperCase(),
      json: mint.name === 'hnt' ? { image: 'hnt.png' } : undefined,
    }),
  }),
  { virtual: true },
)

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const mint = (name: string) =>
  ({ name, toBase58: () => name }) as unknown as PublicKey

const tokenData: TokenListItem[] = [
  { mint: mint('hnt'), selected: true },
  { mint: mint('iot'), selected: false },
]

const setup = (onTokenSelected = jest.fn()) => {
  const ref = React.createRef<TokenSelectorRef>()
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <TokenSelector
        ref={ref}
        tokenData={tokenData}
        onTokenSelected={onTokenSelected}
        className="bg-background"
      >
        screen
      </TokenSelector>,
    )
  })
  const rows = () =>
    renderer.root.findAllByType('ListItem' as unknown as React.ElementType)
  return { ref, renderer, rows }
}

describe('TokenSelector', () => {
  it('wraps the children in a flex view and keeps the sheet closed', () => {
    const { renderer, rows } = setup()
    const wrapper = renderer.root.findByType(
      'View' as unknown as React.ElementType,
    )
    expect(wrapper.props.className).toBe('flex-1 bg-background')
    expect(wrapper.props.children).toContain('screen')
    expect(rows()).toHaveLength(0)
  })

  it('shows a row per token, sized to fit every row', () => {
    const { ref, renderer, rows } = setup()
    act(() => ref.current?.showTokens())

    const sheet = renderer.root.findByType(
      'Sheet' as unknown as React.ElementType,
    )
    expect(sheet.props.snapPoints).toEqual([(2 + 2) * 70 + 20])
    expect(
      rows().map((r) => [r.props.title, r.props.selected, !!r.props.Icon]),
    ).toEqual([
      ['HNT', true, true],
      ['IOT', false, false],
    ])
  })

  it('reports a picked mint and closes the sheet', () => {
    const onTokenSelected = jest.fn()
    const { ref, rows } = setup(onTokenSelected)
    act(() => ref.current?.showTokens())
    act(() => {
      rows()[1].props.onPress()
    })

    expect(onTokenSelected).toHaveBeenCalledWith(tokenData[1].mint)
    expect(rows()).toHaveLength(0)
  })

  it('keeps the row renderer and hands every row one press handler', () => {
    const onTokenSelected = jest.fn()
    const { ref, renderer } = setup(onTokenSelected)
    act(() => ref.current?.showTokens())
    const before = mockRenderItems[mockRenderItems.length - 1]
    act(() => {
      renderer.update(
        <TokenSelector
          ref={ref}
          tokenData={tokenData}
          onTokenSelected={onTokenSelected}
          className="bg-background"
        >
          next screen
        </TokenSelector>,
      )
    })

    expect(mockRenderItems[mockRenderItems.length - 1]).toBe(before)
    const tokenRows = renderer.root.findAll(
      (n) => typeof n.type === 'function' && n.props.mint !== undefined,
    )
    expect(tokenRows).toHaveLength(2)
    expect(tokenRows[0].props.onPress).toBe(tokenRows[1].props.onPress)
  })
})
