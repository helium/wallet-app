import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { ProposalCard } from '../ProposalCard'
import { ProposalV0 } from '../governanceTypes'

// A list row must not fetch: each hook of these modules throws if the row
// calls it. The list calls them once for all rows.
function mockThrows(name: string) {
  return () => {
    throw new Error(`a proposal row called ${name}`)
  }
}

jest.mock('@helium/helium-react-hooks', () => ({
  useMint: mockThrows('useMint'),
}))
jest.mock('@helium/modular-governance-hooks', () => ({
  useProposalConfig: mockThrows('useProposalConfig'),
  useResolutionSettings: mockThrows('useResolutionSettings'),
}))
jest.mock('@tanstack/react-query', () => ({
  useQuery: mockThrows('useQuery'),
}))
jest.mock(
  '@storage/GovernanceProvider',
  () => ({ useGovernance: mockThrows('useGovernance') }),
  { virtual: true },
)
jest.mock(
  '@storage/AccountStorageProvider',
  () => ({ useAccountStorage: mockThrows('useAccountStorage') }),
  { virtual: true },
)
jest.mock(
  '@hooks/useNowAfter',
  () => jest.requireActual('../../../hooks/useNowAfter'),
  { virtual: true },
)
jest.mock(
  '@utils/governanceUtils',
  () => jest.requireActual('../../../utils/governanceUtils'),
  { virtual: true },
)
jest.mock(
  '@utils/formatting',
  () => ({
    humanReadable: (amount: BN, decimals: number) =>
      `${amount.toString()}e-${decimals}`,
  }),
  { virtual: true },
)
jest.mock(
  '@utils/dateTools',
  () => ({ getTimeFromNowFmt: (ts: BN) => `ends ${ts.toString()}` }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ FADE_IN: {}, FADE_OUT: {} }), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
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

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const MINT = new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux')
const PROPOSAL = new PublicKey('SysvarRent111111111111111111111111111111111')

// A proposal in its vote, with 3 + 4 votes cast.
const proposal = {
  name: 'HIP 1',
  uri: 'https://example.com/hip-1.md',
  tags: [],
  state: { voting: { startTs: new BN(100) } },
  choices: [
    { name: 'For', weight: new BN(3) },
    { name: 'Against', weight: new BN(4) },
  ],
} as unknown as ProposalV0

describe('ProposalCard', () => {
  it('renders a proposal from plain props and opens it', () => {
    const onPress = jest.fn(() => Promise.resolve())
    // The vote ends in a day, so the vote is still open.
    const endTs = new BN(Math.floor(Date.now() / 1000) + 24 * 3600)
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <ProposalCard
          filter="all"
          proposal={proposal}
          proposalKey={PROPOSAL}
          mint={MINT}
          decimals={8}
          hasSeen={false}
          endTs={endTs}
          desc="The first proposal."
          descLoading={false}
          onPress={onPress}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer

    expect(
      root.findAllByType('Text' as never).map((n) => n.props.children),
    ).toEqual([
      'UNSEEN',
      'HIP 1',
      'The first proposal.',
      'gov.proposals.estTime',
      `ends ${endTs.toString()}`,
      'gov.proposals.votes',
      '7e-8',
    ])

    act(() => {
      root.findByType('PressableScale' as never).props.onPress()
    })
    expect(onPress).toHaveBeenCalledWith(MINT, PROPOSAL)
    act(() => renderer?.unmount())
  })

  it('renders nothing while its description loads', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <ProposalCard
          filter="all"
          proposal={proposal}
          proposalKey={PROPOSAL}
          mint={MINT}
          decimals={8}
          hasSeen
          descLoading
        />,
      )
    })
    expect(renderer?.toJSON()).toBeNull()
  })
})
