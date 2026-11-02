import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { PositionCard } from '../PositionCard'

// A list row must not fetch or run transactions: each hook of these modules
// throws if the row calls it. The list calls them once for all rows.
function mockThrows(name: string) {
  return () => {
    throw new Error(`a position row called ${name}`)
  }
}

jest.mock('@helium/helium-react-hooks', () => ({
  useMint: mockThrows('useMint'),
  useOwnedAmount: mockThrows('useOwnedAmount'),
  useSolanaUnixNow: mockThrows('useSolanaUnixNow'),
}))
jest.mock('@helium/automation-hooks', () => ({
  TASK_QUEUE: 'queue',
  useDelegationClaimBot: mockThrows('useDelegationClaimBot'),
}))
jest.mock('@helium/voter-stake-registry-hooks', () => ({
  calcLockupMultiplier: () => 1,
  useKnownProxy: mockThrows('useKnownProxy'),
  useRegistrar: mockThrows('useRegistrar'),
}))
jest.mock(
  '@hooks/useGovernanceMutations',
  () => ({
    useExtendPositionMutation: mockThrows('useExtendPositionMutation'),
    useSplitPositionMutation: mockThrows('useSplitPositionMutation'),
    useFlipLockupKindMutation: mockThrows('useFlipLockupKindMutation'),
    useTransferPositionMutation: mockThrows('useTransferPositionMutation'),
    useClosePositionMutation: mockThrows('useClosePositionMutation'),
    useDelegatePositionMutation: mockThrows('useDelegatePositionMutation'),
    useUndelegatePositionMutation: mockThrows('useUndelegatePositionMutation'),
    useRelinquishPositionVotesMutation: mockThrows(
      'useRelinquishPositionVotesMutation',
    ),
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/usePositionDelegations',
  () => ({ usePositionDelegations: mockThrows('usePositionDelegations') }),
  { virtual: true },
)
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: mockThrows('useMetaplexMetadata') }),
  { virtual: true },
)
jest.mock(
  '@hooks/useCurrentWallet',
  () => ({ useCurrentWallet: mockThrows('useCurrentWallet') }),
  { virtual: true },
)
jest.mock(
  '@hooks/useAlert',
  () => ({ __esModule: true, default: mockThrows('useAlert') }),
  { virtual: true },
)
jest.mock(
  '@storage/GovernanceProvider',
  () => ({ useGovernance: mockThrows('useGovernance') }),
  { virtual: true },
)
jest.mock('@react-navigation/native', () => ({
  useNavigation: mockThrows('useNavigation'),
}))
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
jest.mock('@utils/constants', () => ({ Mints: {} }), { virtual: true })
jest.mock(
  '@utils/dateTools',
  () => ({
    daysToSecs: () => 0,
    secsToDays: () => 0,
    getFormattedStringFromDays: () => '',
    getMinDurationFmt: () => '',
    getTimeLeftFromNowFmt: () => '1 month',
  }),
  { virtual: true },
)
jest.mock(
  '@utils/formatting',
  () => ({ shortenAddress: (address: string) => address.slice(0, 4) }),
  { virtual: true },
)
jest.mock('@ui/BlurActionSheet', () => ({ BlurActionSheet: () => null }), {
  virtual: true,
})
jest.mock('@ui/ListItem', () => ({ ListItem: 'ListItem' }), { virtual: true })
jest.mock('@ui/Pill', () => ({ Pill: 'Pill' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/TokenIcon', () => ({ TokenIcon: 'TokenIcon' }), {
  virtual: true,
})
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})
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
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const position = {
  pubkey: new PublicKey('11111111111111111111111111111112'),
  mint: new PublicKey('SysvarRent111111111111111111111111111111111'),
  registrar: new PublicKey('SysvarC1ock11111111111111111111111111111111'),
  lockup: { kind: { cliff: {} }, startTs: new BN(0), endTs: new BN(5000) },
  isDelegated: false,
  hasGenesisMultiplier: false,
  numActiveVotes: 0,
  isProxiedToMe: false,
  proxy: {
    nextVoter: new PublicKey('Vote111111111111111111111111111111111111111'),
  },
  delegatedSubDao: null,
  amountDepositedNative: new BN(150000000),
  votingPower: new BN(300000000),
  genesisEnd: new BN(0),
  votingMint: {
    mint: new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'),
    genesisVotePowerMultiplier: 1,
  },
}

const textOf = (root: TestRenderer.ReactTestInstance) =>
  root.findAllByType('Text' as never).map((n) => n.props.children)

describe('PositionCard', () => {
  it('renders a position from plain props and reports a tap', () => {
    const onPress = jest.fn()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <PositionCard
          position={position as never}
          onPress={onPress}
          unixNow={1000}
          decimals={8}
          symbol="HNT"
          image="hnt.png"
          loadingMetadata={false}
          knownProxyName="Helium Proxy"
          loadingText={null}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer

    expect(textOf(root)).toContain('1.5 HNT')
    expect(textOf(root)).toContain('2.00')
    expect(root.findByType('Pill' as never).props.text).toBe('Helium Proxy')
    expect(root.findByType('TokenIcon' as never).props.img).toBe('hnt.png')

    act(() => {
      root.find((n) => n.props.testID === 'PositionCard').props.onPress()
    })
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('shows the transaction status of its position', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <PositionCard
          position={position as never}
          onPress={() => {}}
          unixNow={1000}
          decimals={8}
          symbol="HNT"
          loadingMetadata={false}
          loadingText="gov.positions.closing"
        />,
      )
    })
    if (!renderer) throw new Error('render failed')

    expect(textOf(renderer.root)).toEqual(['gov.positions.closing'])
    expect(renderer.root.findAllByType('Spinner' as never)).toHaveLength(1)
  })
})
