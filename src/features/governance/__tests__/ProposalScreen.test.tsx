import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import ProposalScreen from '../ProposalScreen'

const mockPush = jest.fn()

jest.mock('@ui/TabSafeAreaView', () => ({ TabSafeAreaView: 'SafeAreaView' }), {
  virtual: true,
})
jest.mock('@react-navigation/native', () => {
  const navigation = {
    push: (...args: unknown[]) => mockPush(...args),
    navigate: () => {},
  }
  const route = { params: { proposal: 'proposal-key' } }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('@solana/web3.js', () => ({
  PublicKey: class {
    toBase58 = () => 'proposal-key'
  },
}))
jest.mock(
  '@storage/GovernanceProvider',
  () => {
    // No positions, so the wallet has no voting power in this dao.
    const governance = {
      mint: { toBase58: () => 'hnt-mint' },
      loading: false,
      votingPower: undefined,
      positions: [],
      refetch: () => {},
    }
    return { useGovernance: () => governance }
  },
  { virtual: true },
)
jest.mock(
  '@storage/AccountStorageProvider',
  () => {
    const accountStorage = {
      currentAccount: { proposalIdsSeenByMint: { 'hnt-mint': [] } },
      upsertAccount: () => Promise.resolve(),
    }
    return { useAccountStorage: () => accountStorage }
  },
  { virtual: true },
)
jest.mock('@helium/helium-react-hooks', () => ({ useMint: () => undefined }))
jest.mock('@helium/modular-governance-hooks', () => ({
  useProposal: () => ({ info: undefined }),
  useProposalConfig: () => ({ info: undefined }),
  useResolutionSettings: () => ({ info: undefined }),
}))
jest.mock('@helium/voter-stake-registry-hooks', () => ({
  useRegistrar: () => ({ info: undefined }),
  useVote: () => ({
    didVote: undefined,
    canVote: () => false,
    voters: undefined,
  }),
  useRelinquishVote: () => ({ canRelinquishVote: () => false }),
}))
jest.mock(
  '@hooks/useGovernanceMutations',
  () => {
    const mutation = { submit: () => {}, isPending: false, error: undefined }
    return {
      useVoteMutation: () => mutation,
      useRelinquishVoteMutation: () => mutation,
    }
  },
  { virtual: true },
)
jest.mock('@hooks/useNowAfter', () => () => 0, { virtual: true })
jest.mock(
  '@utils/governanceUtils',
  () => ({ getDerivedProposalState: () => 'active' }),
  { virtual: true },
)
jest.mock('@utils/dateTools', () => ({ getTimeFromNowFmt: () => '' }), {
  virtual: true,
})
jest.mock('@utils/formatting', () => ({ humanReadable: () => '0' }), {
  virtual: true,
})
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ error: null, data: undefined }),
}))
jest.mock('axios', () => ({ get: () => Promise.resolve({ data: null }) }))
jest.mock('@ui/BackScreen', () => ({ BackScreen: 'BackScreen' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/buttonVariants', () => ({ buttonTextVariants: () => '' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('../Markdown', () => ({ Markdown: 'Markdown' }))
jest.mock('../VoteOption', () => ({
  VoteOption: 'VoteOption',
  votingResultColor: () => '',
}))
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
jest.mock('react-native', () => ({ View: 'View', ScrollView: 'ScrollView' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  ChevronRight: 'ChevronRight',
  Users: 'Users',
}))
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const textOf = (node: TestRenderer.ReactTestInstance) =>
  node.findAllByType('Text' as never).map((n) => n.props.children)

describe('ProposalScreen', () => {
  it('shows the no-power caret as a chevron icon in the one press target', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<ProposalScreen />)
    })
    if (!renderer) throw new Error('render failed')
    const pressables = renderer.root.findAllByType('PressableScale' as never)
    expect(pressables).toHaveLength(1)
    const [row] = pressables

    expect(textOf(row)).toContain(
      'gov.votingPower.noPower, gov.votingPower.increase',
    )
    expect(row.findAllByType('ChevronRight' as never)).toHaveLength(1)
    expect(textOf(row)).not.toContain('>')

    act(() => {
      row.props.onPress()
    })
    expect(mockPush).toHaveBeenCalledWith('PositionsScreen', {
      mint: 'hnt-mint',
    })
  })
})

describe('ProposalScreen cards', () => {
  it('draws every card with the card radius and panel padding', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<ProposalScreen />)
    })
    if (!renderer) throw new Error('render failed')
    const cards = renderer.root
      .findAllByType('View' as never)
      .map((v) => String(v.props.className).split(' '))
      .filter((classes) => classes.includes('bg-card'))

    // The proposal summary and the no-power row.
    expect(cards).toHaveLength(2)
    cards.forEach((classes) => {
      expect(classes).toEqual(
        expect.arrayContaining(['rounded-2xl', 'px-4', 'py-[15px]']),
      )
      expect(classes).not.toContain('rounded-[12px]')
      expect(classes).not.toContain('p-4')
    })
  })
})
