import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import HotspotList from '../HotspotList'

jest.mock('@helium/helium-react-hooks', () => ({ useMint: () => undefined }), {
  virtual: true,
})
jest.mock(
  '@helium/spl-utils',
  () => ({
    HNT_MINT: 'hnt',
    IOT_MINT: 'iot',
    MOBILE_MINT: 'mobile',
    toNumber: () => 0,
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/useHotspots',
  () => () => ({
    hotspots: [],
    hotspotsWithMeta: [],
    loading: false,
    refresh: () => {},
    fetchMore: () => {},
    fetchingMore: false,
    onEndReached: true,
    totalHotspots: 0,
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({
    useMetaplexMetadata: () => ({}),
  }),
  { virtual: true },
)
jest.mock('@react-navigation/native', () => {
  const navigation = { navigate: jest.fn(), addListener: () => () => {} }
  return { useIsFocused: () => true, useNavigation: () => navigation }
})
jest.mock('@solana/web3.js', () => ({}))
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/TokenIcon', () => ({ TokenIcon: 'TokenIcon' }), {
  virtual: true,
})
jest.mock('lucide-react-native', () => ({
  Globe: 'Globe',
  Plus: 'Plus',
  Repeat: 'Repeat',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  RefreshControl: 'RefreshControl',
  View: 'View',
}))
// Render the header and footer inside the list, as the real list does.
jest.mock('react-native-gesture-handler', () => {
  const { createElement } = jest.requireActual('react')
  return {
    FlatList: (props: {
      ListHeaderComponent: unknown
      ListFooterComponent: unknown
    }) =>
      createElement(
        'FlatList',
        props,
        props.ListHeaderComponent,
        props.ListFooterComponent,
      ),
  }
})
jest.mock('uniwind', () => ({
  useCSSVariable: () => undefined,
  withUniwind: (c: unknown) => c,
}))
jest.mock('../../../utils/accountUtils', () => ({
  formatLargeNumber: () => '',
}))
jest.mock('../HotspotCompressedListItem', () => 'HotspotCompressedListItem')
jest.mock('../NftListItem', () => ({ NFTSkeleton: 'NFTSkeleton' }))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = () => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(<HotspotList />)
  })
  return renderer.root
}

describe('HotspotList', () => {
  it('insets the cards, header actions and footer by a 16 px gutter', () => {
    const list = render().findByType('FlatList' as never)

    expect(list.props.contentContainerStyle).toEqual({ paddingHorizontal: 16 })
    expect(list.findAllByType('Globe' as never)).toHaveLength(1)
    expect(list.findAllByType('Plus' as never)).toHaveLength(1)
  })
})
