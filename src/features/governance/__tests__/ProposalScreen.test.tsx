import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { ProposalScreen } from '../ProposalScreen'

let mockRouteParams: { mint: string; proposal: string }
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: () => {}, push: () => {} }),
  useRoute: () => ({ params: mockRouteParams }),
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View', ScrollView: 'ScrollView' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({ Users: 'Users' }))
jest.mock('@helium/helium-react-hooks', () => ({ useMint: () => ({}) }))
jest.mock('@helium/modular-governance-hooks', () => ({
  useProposal: () => ({}),
  useProposalConfig: () => ({}),
  useResolutionSettings: () => ({}),
}))
jest.mock('@helium/voter-stake-registry-hooks', () => ({
  useRegistrar: () => ({}),
  useRelinquishVote: () => ({}),
  useVote: () => ({}),
}))
jest.mock(
  '@hooks/useGovernanceMutations',
  () => ({
    useVoteMutation: () => ({}),
    useRelinquishVoteMutation: () => ({}),
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/useNowAfter',
  () => ({ __esModule: true, default: () => 0 }),
  {
    virtual: true,
  },
)
jest.mock(
  '@storage/AccountStorageProvider',
  () => ({ useAccountStorage: () => ({}) }),
  { virtual: true },
)
jest.mock(
  '@storage/GovernanceProvider',
  () => ({ useGovernance: () => ({}) }),
  { virtual: true },
)
jest.mock(
  '@ui/BackScreen',
  () => ({
    BackScreen: ({ children }: { children: React.ReactNode }) => children,
  }),
  { virtual: true },
)
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/buttonVariants', () => ({ buttonTextVariants: () => '' }), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@utils/dateTools', () => ({ getTimeFromNowFmt: () => '' }), {
  virtual: true,
})
jest.mock('@utils/formatting', () => ({ humanReadable: () => '' }), {
  virtual: true,
})
jest.mock(
  '@utils/governanceUtils',
  () => ({ getDerivedProposalState: () => undefined }),
  { virtual: true },
)
jest.mock('axios', () => ({ get: () => Promise.resolve({ data: null }) }))
jest.mock('@tanstack/react-query', () => ({ useQuery: () => ({}) }))
jest.mock('../Markdown', () => ({ Markdown: 'Markdown' }))
jest.mock('../VoteOption', () => ({
  VoteOption: 'VoteOption',
  votingResultColor: () => '',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('ProposalScreen', () => {
  it('shows an error state for a proposal param that is not a public key', async () => {
    // heliumwallet://governance/<mint>/proposal/not-base58 (src/utils/linking.ts)
    mockRouteParams = { mint: 'hnt-mint', proposal: 'not-base58' }

    let renderer: TestRenderer.ReactTestRenderer | undefined
    await act(async () => {
      renderer = TestRenderer.create(<ProposalScreen />)
    })
    if (!renderer) throw new Error('render failed')

    expect(
      renderer.root.findByProps({ children: 'gov.errors.invalidProposal' }),
    ).toBeTruthy()
  })
})
