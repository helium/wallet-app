import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import CollectionScreen from '../CollectionScreen'

const mockNavigate = jest.fn()
const mockCollection = [
  {
    id: 'nft1',
    json: { image: 'one.png' },
    content: { metadata: { symbol: 'X' } },
  },
  {
    id: 'nft2',
    json: { image: 'two.png' },
    content: { metadata: { symbol: 'X' } },
  },
]

// The list renders one row per collectable.
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  return {
    LogBox: { ignoreLogs: () => {} },
    FlatList: ({
      data,
      renderItem,
      keyExtractor,
    }: {
      data: { id: string }[]
      renderItem: (info: { item: unknown }) => React.ReactNode
      keyExtractor: (item: unknown) => string
    }) =>
      ReactActual.createElement(
        'FlatList',
        { renderItem, keyExtractor },
        data.map((item) =>
          ReactActual.createElement(
            ReactActual.Fragment,
            { key: keyExtractor(item) },
            renderItem({ item }),
          ),
        ),
      ),
  }
})
jest.mock('@react-navigation/native', () => {
  const navigation = {
    navigate: (...args: unknown[]) => mockNavigate(...args),
  }
  return {
    useNavigation: () => navigation,
    useRoute: () => ({ params: { collection: mockCollection } }),
  }
})
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('text-encoding-polyfill', () => ({}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('@ui/Image', () => ({ Image: 'Image' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@utils/layout', () => ({ useCollectableHeight: () => 180 }), {
  virtual: true,
})
jest.mock('../components/BackHeader', () => ({
  __esModule: true,
  default: 'BackHeader',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = () => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(<CollectionScreen />)
  })
  return renderer
}

describe('CollectionScreen', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('opens the pressed collectable', () => {
    const renderer = render()
    const tiles = renderer.root.findAllByType('PressableScale' as never)
    expect(tiles).toHaveLength(2)

    act(() => {
      tiles[1].props.onPress()
    })

    expect(mockNavigate).toHaveBeenCalledWith('NftDetailsScreen', {
      collectable: mockCollection[1],
    })
  })

  it('hands every row the same press handler', () => {
    const renderer = render()
    const rows = renderer.root.findAll(
      (n) => typeof n.type === 'function' && n.props.collectable !== undefined,
    )

    expect(rows).toHaveLength(2)
    expect(rows[0].props.onPress).toBe(rows[1].props.onPress)
  })

  it('shares one image style across the rows', () => {
    const renderer = render()
    const images = renderer.root.findAllByType('Image' as never)

    expect(images[0].props.style).toEqual({ height: 180 })
    expect(images[0].props.style).toBe(images[1].props.style)
  })

  it('keys each recycled image to its collectable and covers the tile', () => {
    const renderer = render()
    const images = renderer.root.findAllByType('Image' as never)

    expect(images.map((i) => i.props.recyclingKey)).toEqual(['nft1', 'nft2'])
    expect(images.map((i) => i.props.contentFit)).toEqual(['cover', 'cover'])
  })

  it('keeps the row renderer when the screen re-renders', () => {
    const renderer = render()
    const list = () => renderer.root.findByType('FlatList' as never).props
    const before = list().renderItem

    act(() => {
      renderer.update(<CollectionScreen />)
    })

    expect(list().renderItem).toBe(before)
  })
})
