import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { PositionsList } from '../PositionsList'

const mockNavigate = jest.fn()
const mockRefetch = jest.fn()

// The mutation hooks the position actions call. Each test reads the submit
// calls of the close mutation.
const mockMutation = () => ({
  prepare: jest.fn(() => Promise.resolve()),
  submit: jest.fn(() => Promise.resolve()),
  estimatedSolFee: null,
  isPending: false,
  error: null,
  reset: jest.fn(),
})
const mockMutations = {
  extend: mockMutation(),
  split: mockMutation(),
  flip: mockMutation(),
  transfer: mockMutation(),
  close: mockMutation(),
  delegate: mockMutation(),
  undelegate: mockMutation(),
  relinquish: mockMutation(),
}

// A cliff position that ended before the chain time below, with no votes and
// no delegation: its one action is close.
const mockPosition = {
  pubkey: new PublicKey('11111111111111111111111111111112'),
  mint: new PublicKey('SysvarRent111111111111111111111111111111111'),
  registrar: new PublicKey('SysvarC1ock11111111111111111111111111111111'),
  lockup: { kind: { cliff: {} }, startTs: new BN(0), endTs: new BN(100) },
  isDelegated: false,
  hasGenesisMultiplier: false,
  numActiveVotes: 0,
  isProxiedToMe: false,
  proxy: null,
  delegatedSubDao: null,
  amountDepositedNative: new BN(5),
  votingPower: new BN(0),
  genesisEnd: new BN(0),
  votingMint: {
    mint: new PublicKey('Stake11111111111111111111111111111111111111'),
    genesisVotePowerMultiplier: 1,
    genesisVotePowerMultiplierExpirationTs: new BN(0),
    lockupSaturationSecs: new BN(1),
  },
}

const mockGovernance = {
  loading: false,
  positions: [mockPosition],
  mint: mockPosition.votingMint.mint,
  network: 'hnt',
  refetch: () => mockRefetch(),
  voteService: undefined,
}

jest.mock(
  '@storage/GovernanceProvider',
  () => ({ useGovernance: () => mockGovernance }),
  { virtual: true },
)
jest.mock(
  '@hooks/useGovernanceMutations',
  () => ({
    useExtendPositionMutation: () => mockMutations.extend,
    useSplitPositionMutation: () => mockMutations.split,
    useFlipLockupKindMutation: () => mockMutations.flip,
    useTransferPositionMutation: () => mockMutations.transfer,
    useClosePositionMutation: () => mockMutations.close,
    useDelegatePositionMutation: () => mockMutations.delegate,
    useUndelegatePositionMutation: () => mockMutations.undelegate,
    useRelinquishPositionVotesMutation: () => mockMutations.relinquish,
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/usePositionDelegations',
  () => {
    const delegations = { delegations: {}, refetch: () => Promise.resolve() }
    return { usePositionDelegations: () => delegations }
  },
  { virtual: true },
)
jest.mock(
  '@hooks/useAlert',
  () => {
    const alert = { showOKAlert: () => Promise.resolve() }
    return { __esModule: true, default: () => alert }
  },
  { virtual: true },
)
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => {
    const metadata = { loading: false, symbol: 'HNT', json: undefined }
    return { useMetaplexMetadata: () => metadata }
  },
  { virtual: true },
)
jest.mock('@helium/helium-react-hooks', () => {
  const mint = { info: { decimals: 8 } }
  const owned = { amount: undefined }
  return {
    useMint: () => mint,
    useOwnedAmount: () => owned,
    useSolOwnedAmount: () => owned,
    useSolanaUnixNow: () => 1000,
  }
})
jest.mock('@helium/voter-stake-registry-hooks', () => {
  const subDaos = { loading: false, result: [] }
  const registrar = { info: undefined }
  return {
    useSubDaos: () => subDaos,
    useRegistrar: () => registrar,
    useKnownProxy: () => ({ knownProxy: undefined }),
    calcLockupMultiplier: () => 1,
  }
})
jest.mock('@helium/automation-hooks', () => {
  const bot = { info: undefined }
  return { TASK_QUEUE: 'queue', useDelegationClaimBot: () => bot }
})
jest.mock('@helium/helium-sub-daos-sdk', () => ({
  EPOCH_LENGTH: 86400,
  delegatedPositionKey: () => ['delegated-position'],
}))
jest.mock('@helium/hpl-crons-sdk', () => ({
  delegationClaimBotKey: () => ['claim-bot'],
}))
jest.mock('@helium/organization-sdk', () => ({
  organizationKey: () => ['organization'],
}))
jest.mock('@helium/spl-utils', () => ({
  HNT_MINT: new (jest.requireActual('@solana/web3.js').PublicKey)(
    'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
  ),
  humanReadable: () => '0.00000005',
  toBN: () => '0',
  toNumber: () => 0,
}))
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined }),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))
jest.mock('@utils/constants', () => ({ Mints: {} }), { virtual: true })
jest.mock(
  '@utils/dateTools',
  () => ({
    daysToSecs: () => 0,
    secsToDays: () => 0,
    getFormattedStringFromDays: () => '',
    getMinDurationFmt: () => '',
    getTimeLeftFromNowFmt: () => '',
  }),
  { virtual: true },
)
jest.mock('@utils/formatting', () => ({ shortenAddress: () => '' }), {
  virtual: true,
})
// The sheet shows its actions only while it is open.
jest.mock(
  '@ui/BlurActionSheet',
  () => ({
    BlurActionSheet: ({
      open,
      children,
    }: {
      open?: boolean
      children: React.ReactNode
    }) => (open ? children : null),
  }),
  { virtual: true },
)
jest.mock('@ui/ListItem', () => ({ ListItem: 'ListItem' }), { virtual: true })
jest.mock('@ui/CardSkeleton', () => ({ CardSkeleton: 'CardSkeleton' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
jest.mock('../PositionCard', () => ({ PositionCard: 'PositionCard' }))
jest.mock('../DelegateTokensModal', () => ({
  DelegateTokensModal: 'DelegateTokensModal',
}))
jest.mock('../LockTokensModal', () => ({
  __esModule: true,
  default: 'LockTokensModal',
}))
jest.mock('../TransferTokensModal', () => ({
  TransferTokensModal: 'TransferTokensModal',
}))
jest.mock('react-i18next', () => {
  const translation = { t: (key: string) => key }
  return { useTranslation: () => translation }
})
// The list renders each item of each section through renderItem.
jest.mock('react-native', () => {
  const ReactActual = jest.requireActual('react')
  return {
    View: 'View',
    RefreshControl: 'RefreshControl',
    SectionList: ({
      sections,
      renderItem,
    }: {
      sections: { data: unknown[] }[]
      renderItem: (info: { item: unknown; index: number }) => React.ReactNode
    }) =>
      ReactActual.createElement(
        'SectionList',
        null,
        sections.flatMap((section) =>
          section.data.map((item, index) => renderItem({ item, index })),
        ),
      ),
  }
})
jest.mock('uniwind', () => ({
  withUniwind: (c: unknown) => c,
  useCSSVariable: () => '#fff',
}))
jest.mock('lucide-react-native', () => ({ Zap: 'Zap' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('PositionsList', () => {
  it('closes a decayed position from the list action sheet', async () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(<PositionsList />)
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer
    const [card] = root.findAllByType('PositionCard' as never)
    if (!card) throw new Error('no position card')
    expect(
      root.findAll((n) => n.props.title === 'gov.positions.close'),
    ).toHaveLength(0)

    act(() => {
      card.props.onPress()
    })
    const close = root.find(
      (n) =>
        (n.type as unknown) === 'ListItem' &&
        n.props.title === 'gov.positions.close',
    )
    await act(async () => {
      close.props.onPress()
    })

    expect(mockMutations.close.submit).toHaveBeenCalledTimes(1)
    expect(mockMutations.close.submit).toHaveBeenCalledWith(
      { positionMint: mockPosition.mint.toBase58() },
      {
        header: 'gov.transactions.closePosition',
        message: 'gov.positions.closeMessage',
      },
    )
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })
})
