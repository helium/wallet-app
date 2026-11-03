import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { ProxySearch } from '../ProxySearch'

// One page of search results from the proxy service.
const mockResult = {
  data: { pages: [[{ wallet: 'WalletA', name: 'Alice' }]] },
  isLoading: false,
  isPending: false,
}

// The list renders its header, which holds the search input.
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  return {
    FlatList: ({
      ListHeaderComponent,
      ...props
    }: {
      ListHeaderComponent: React.ReactNode
    }) => ReactActual.createElement('FlatList', props, ListHeaderComponent),
    View: 'View',
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  }
})
jest.mock('@react-native-community/hooks', () => ({
  useKeyboard: () => ({ keyboardHeight: 0 }),
}))
jest.mock('@react-navigation/native', () => {
  const navigation = { navigate: () => {} }
  return { useNavigation: () => navigation }
})
jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: () => mockResult,
}))
jest.mock('@helium/voter-stake-registry-hooks', () => ({
  proxiesQuery: () => ({}),
}))
jest.mock(
  '@storage/GovernanceProvider',
  () => {
    const governance = { voteService: undefined, mint: { toBase58: () => '' } }
    return { useGovernance: () => governance }
  },
  { virtual: true },
)
jest.mock('use-debounce', () => ({ useDebounce: (v: string) => [v] }))
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ Users: 'Users' }))
jest.mock('@ui/SearchInput', () => ({ SearchInput: 'SearchInput' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@utils/formatting', () => ({ shortenAddress: (a: string) => a }), {
  virtual: true,
})

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = (onValueChange = jest.fn()) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <ProxySearch value="" onValueChange={onValueChange} />,
    )
  })
  const list = () => renderer.root.findByType('FlatList' as never).props
  return { renderer, list, onValueChange }
}

describe('ProxySearch', () => {
  it('keeps one empty result list while the search is closed', () => {
    const onValueChange = jest.fn()
    const { renderer, list } = render(onValueChange)
    const before = list().data
    expect(before).toEqual([])

    act(() => {
      renderer.update(<ProxySearch value="" onValueChange={onValueChange} />)
    })

    expect(list().data).toBe(before)
  })

  it('keys each result by its wallet', () => {
    const { renderer, list } = render()
    act(() => {
      renderer.root
        .findByType('SearchInput' as never)
        .props.textInputProps.onFocus()
    })

    expect(list().data).toEqual([
      { value: 'WalletA', label: 'Alice | WalletA' },
    ])
    expect(list().keyExtractor?.(list().data[0], 0)).toBe('WalletA')
  })

  it('lists a pasted wallet once when it is also a result', () => {
    const wallet = 'SysvarRent111111111111111111111111111111111'
    const { data } = mockResult
    mockResult.data = { pages: [[{ wallet, name: 'Alice' }]] }
    try {
      const { renderer, list } = render()
      const input = renderer.root.findByType('SearchInput' as never)
      act(() => {
        input.props.textInputProps.onFocus()
      })
      act(() => {
        input.props.onChangeText(wallet)
      })

      expect(list().data).toEqual([
        { value: wallet, label: `Alice | ${wallet}` },
      ])
    } finally {
      mockResult.data = data
    }
  })
})
