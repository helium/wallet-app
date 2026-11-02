import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { VotingPowerCard } from '../VotingPowerCard'

jest.mock('@helium/helium-react-hooks', () => ({
  useMint: () => ({ info: { decimals: 8 } }),
  useOwnedAmount: () => ({ amount: undefined }),
}))
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'HNT' }) }),
  { virtual: true },
)
jest.mock(
  '@storage/GovernanceProvider',
  () => {
    const governance = { loading: false, mint: 'hnt-mint' }
    return { useGovernance: () => governance }
  },
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ FADE_IN: {}, FADE_OUT: {} }), {
  virtual: true,
})
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@utils/formatting', () => ({ humanReadable: () => '0' }), {
  virtual: true,
})
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  ChevronRight: 'ChevronRight',
  Zap: 'Zap',
}))
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const textOf = (node: TestRenderer.ReactTestInstance) =>
  node.findAllByType('Text' as never).map((n) => n.props.children)

describe('VotingPowerCard', () => {
  it('shows the caret as a chevron icon inside the one press target', () => {
    const onPress = jest.fn(() => Promise.resolve())
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<VotingPowerCard onPress={onPress} />)
    })
    if (!renderer) throw new Error('render failed')
    const pressables = renderer.root.findAllByType('PressableScale' as never)
    expect(pressables).toHaveLength(1)
    const [card] = pressables

    expect(card.findAllByType('ChevronRight' as never)).toHaveLength(1)
    expect(textOf(card)).not.toContain('>')

    act(() => {
      card.props.onPress()
    })
    expect(onPress).toHaveBeenCalledWith('hnt-mint')
  })
})
