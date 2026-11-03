import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import NftList from '../NftList'

jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  {
    virtual: true,
  },
)
jest.mock(
  '@hooks/useCollectables',
  () => () => ({
    collectables: {},
    collectablesWithMeta: {},
    loading: false,
    refresh: () => {},
  }),
  { virtual: true },
)
jest.mock('@react-navigation/native', () => {
  const navigation = { addListener: () => () => {} }
  return { useNavigation: () => navigation }
})
jest.mock('react-native', () => ({
  RefreshControl: 'RefreshControl',
  View: 'View',
}))
jest.mock('react-native-gesture-handler', () => ({ FlatList: 'FlatList' }))
jest.mock('uniwind', () => ({ useCSSVariable: () => undefined }))
jest.mock('../NftListItem', () => ({
  __esModule: true,
  default: 'NFTListItem',
  NFTSkeleton: 'NFTSkeleton',
}))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('NftList', () => {
  // 8 px of padding plus the m-2 on each card gives a 16 px outer edge.
  it('pads the list by 8 px so the cards sit 16 px from the edge', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<NftList />)
    })

    expect(
      renderer.root.findByType('FlatList' as never).props.contentContainerStyle,
    ).toEqual({ marginTop: 16, paddingHorizontal: 8 })
  })

  // Native tabs draw the screen under the tab bar; only the screen's own
  // safe area lets the last row scroll clear of it.
  it('ends the list with a footer that clears the tab bar', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<NftList />)
    })
    const footer = renderer.root.findByType('FlatList' as never).props
      .ListFooterComponent

    expect(footer?.type).toBe('TabSafeAreaView')
    expect(footer?.props.edges).toContain('bottom')
  })
})
