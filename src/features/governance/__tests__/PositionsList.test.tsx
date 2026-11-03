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
// Every position gets the same claim bot key here. A test sets `info` to give
// the positions a claim bot, and `loading` to hold the read in flight.
const mockClaimBot: { info: object | undefined; loading: boolean } = {
  info: undefined,
  loading: false,
}
jest.mock('@helium/automation-hooks', () => ({
  TASK_QUEUE: 'queue',
  useDelegationClaimBot: () => mockClaimBot,
}))
jest.mock('@helium/helium-sub-daos-sdk', () => ({
  EPOCH_LENGTH: 86400,
  delegatedPositionKey: () => ['delegated-position'],
}))
jest.mock('@helium/hpl-crons-sdk', () => ({
  delegationClaimBotKey: () => [{ toBase58: () => 'claim-bot' }],
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
        { sections },
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
  it('renders the rows before a position is tapped', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<PositionsList />)
    })

    expect(
      renderer.root
        .findAllByType('PositionCard' as never)
        .map((c) => c.props.position),
    ).toEqual([mockPosition])
  })

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

  it('offers only own positions as transfer targets', () => {
    // Positions still locked past the chain time, so transfer is an action
    const locked = {
      ...mockPosition,
      lockup: { kind: { cliff: {} }, startTs: new BN(0), endTs: new BN(1e6) },
    }
    const source = {
      ...locked,
      pubkey: new PublicKey('SysvarS1otHashes111111111111111111111111111'),
    }
    const ownTarget = {
      ...locked,
      pubkey: new PublicKey('SysvarStakeHistory1111111111111111111111111'),
    }
    const proxiedTarget = {
      ...locked,
      pubkey: new PublicKey('SysvarRecentB1ockHashes11111111111111111111'),
      isProxiedToMe: true,
    }
    const delegatedTarget = {
      ...locked,
      pubkey: new PublicKey('SysvarFees111111111111111111111111111111111'),
      isDelegated: true,
    }
    const { positions } = mockGovernance
    mockGovernance.positions = [
      source,
      ownTarget,
      proxiedTarget,
      delegatedTarget,
    ]
    try {
      let renderer!: TestRenderer.ReactTestRenderer
      act(() => {
        renderer = TestRenderer.create(<PositionsList />)
      })
      const { root } = renderer
      const card = root
        .findAllByType('PositionCard' as never)
        .find((c) => c.props.position === source)
      if (!card) throw new Error('no source card')
      act(() => {
        card.props.onPress()
      })
      const transfer = root.find(
        (n) =>
          (n.type as unknown) === 'ListItem' && n.props.title === 'Transfer',
      )
      act(() => {
        transfer.props.onPress()
      })

      const modal = root.findByType('TransferTokensModal' as never)
      expect(modal.props.positions).not.toContain(source)
      expect(modal.props.positions).not.toContain(delegatedTarget)
      expect(modal.props.positions).toEqual([ownTarget])
    } finally {
      mockGovernance.positions = positions
    }
  })

  it('turns automation on for each position with a claim bot', () => {
    // Positions still locked past the chain time, in HNT, so delegate is an
    // action
    const delegatable = {
      ...mockPosition,
      lockup: { kind: { cliff: {} }, startTs: new BN(0), endTs: new BN(1e6) },
      votingMint: {
        ...mockPosition.votingMint,
        mint: new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'),
      },
    }
    const first = {
      ...delegatable,
      pubkey: new PublicKey('SysvarS1otHashes111111111111111111111111111'),
    }
    const second = {
      ...delegatable,
      pubkey: new PublicKey('SysvarStakeHistory1111111111111111111111111'),
    }
    const { positions } = mockGovernance
    mockGovernance.positions = [first, second]
    mockClaimBot.info = {}
    try {
      let renderer!: TestRenderer.ReactTestRenderer
      act(() => {
        renderer = TestRenderer.create(<PositionsList />)
      })
      const { root } = renderer
      const openDelegateModal = (position: typeof first) => {
        const card = root
          .findAllByType('PositionCard' as never)
          .find((c) => c.props.position === position)
        if (!card) throw new Error('no position card')
        act(() => {
          card.props.onPress()
        })
        const delegate = root.find(
          (n) =>
            (n.type as unknown) === 'ListItem' &&
            n.props.testID === 'PositionCard.Delegate',
        )
        act(() => {
          delegate.props.onPress()
        })
        return root.findByType('DelegateTokensModal' as never)
      }
      const closeModal = (modal: TestRenderer.ReactTestInstance) => {
        act(() => {
          modal.props.onClose()
        })
      }

      const firstModal = openDelegateModal(first)
      expect(firstModal.props.automationEnabled).toBe(true)
      closeModal(firstModal)
      const secondModal = openDelegateModal(second)
      expect(secondModal.props.automationEnabled).toBe(true)
      closeModal(secondModal)
      const againModal = openDelegateModal(first)
      expect(againModal.props.automationEnabled).toBe(true)
    } finally {
      mockGovernance.positions = positions
      mockClaimBot.info = undefined
    }
  })

  describe('claim bot automation', () => {
    // Positions still locked past the chain time, in HNT, so delegate is an
    // action
    const delegatable = {
      ...mockPosition,
      lockup: { kind: { cliff: {} }, startTs: new BN(0), endTs: new BN(1e6) },
      votingMint: {
        ...mockPosition.votingMint,
        mint: new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'),
      },
    }
    const first = {
      ...delegatable,
      pubkey: new PublicKey('SysvarS1otHashes111111111111111111111111111'),
    }
    const second = {
      ...delegatable,
      pubkey: new PublicKey('SysvarStakeHistory1111111111111111111111111'),
    }
    const { positions } = mockGovernance
    let renderer!: TestRenderer.ReactTestRenderer

    beforeEach(() => {
      mockGovernance.positions = [first, second]
      mockClaimBot.info = {}
      act(() => {
        renderer = TestRenderer.create(<PositionsList />)
      })
    })
    afterEach(() => {
      mockGovernance.positions = positions
      mockClaimBot.info = undefined
      mockClaimBot.loading = false
    })

    const rerender = () => {
      act(() => {
        renderer.update(<PositionsList />)
      })
    }
    const modal = () => renderer.root.findByType('DelegateTokensModal' as never)
    const openDelegateModal = (position: typeof first) => {
      const card = renderer.root
        .findAllByType('PositionCard' as never)
        .find((c) => c.props.position === position)
      if (!card) throw new Error('no position card')
      act(() => {
        card.props.onPress()
      })
      const delegate = renderer.root.find(
        (n) =>
          (n.type as unknown) === 'ListItem' &&
          n.props.testID === 'PositionCard.Delegate',
      )
      act(() => {
        delegate.props.onPress()
      })
    }

    it('keeps automation off when the claim bot account updates', () => {
      openDelegateModal(first)
      expect(modal().props.automationEnabled).toBe(true)
      act(() => {
        modal().props.onSetAutomationEnabled(false)
      })
      expect(modal().props.automationEnabled).toBe(false)

      // The same claim bot account, decoded again
      mockClaimBot.info = {}
      rerender()

      expect(modal().props.automationEnabled).toBe(false)
    })

    it('waits for the claim bot read of the next position', () => {
      openDelegateModal(first)
      act(() => {
        modal().props.onClose()
      })

      // The read of the next position is in flight, with the bot of the
      // previous position still in hand
      mockClaimBot.loading = true
      openDelegateModal(second)
      expect(modal().props.automationEnabled).toBe(false)

      mockClaimBot.loading = false
      rerender()

      expect(modal().props.automationEnabled).toBe(true)
    })
  })

  it('keeps the sections when the list re-renders', () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(<PositionsList />)
    })
    const sections = () =>
      renderer.root.findByType('SectionList' as never).props.sections
    const before = sections()
    expect(before[0].data).toEqual([mockPosition])

    act(() => {
      renderer.update(<PositionsList className="mt-2" />)
    })

    expect(sections()).toBe(before)
  })
})
