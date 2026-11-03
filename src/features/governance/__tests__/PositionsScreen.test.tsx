import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { PositionsScreen } from '../PositionsScreen'

// The app build runs the React Compiler, which this jest config does not. The
// compiler is free to drop a useMemo (React documents useMemo as a hint it
// may discard), and it drops the one on the delegated positions, so they get
// a new array on each render. This mock makes every useMemo recompute on each
// render, as the compiled screen does.
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useMemo: (fn: () => unknown) => fn(),
}))

type Key = { name: string; equals: (other: Key) => boolean }
const mockKey = (name: string): Key => ({
  name,
  equals: (other) => other.name === name,
})

// The screen reads these at import, before mockKey is defined.
jest.mock(
  '@utils/constants',
  () => {
    const key = (name: string) => ({
      name,
      equals: (other: { name: string }) => other.name === name,
    })
    return {
      MOBILE_SUB_DAO_KEY: key('mobile'),
      IOT_SUB_DAO_KEY: key('iot'),
      Mints: { IOT: 'iot-mint', MOBILE: 'mobile-mint' },
    }
  },
  { virtual: true },
)

const mockSubDaos = {
  result: [
    { pubkey: mockKey('mobile'), dntMetadata: { name: 'Helium Mobile' } },
    { pubkey: mockKey('iot'), dntMetadata: { name: 'Helium IOT' } },
  ],
}
jest.mock('@helium/voter-stake-registry-hooks', () => ({
  calcLockupMultiplier: () => 0,
  useSubDaos: () => mockSubDaos,
}))

type Position = {
  mint: { toBase58: () => string }
  isDelegated: boolean
  delegatedSubDao: Key | null
  isProxiedToMe: boolean
  lockup: { kind: { constant: object }; endTs: unknown }
}
const mockPosition = (name: string, delegatedTo?: string): Position => ({
  mint: { toBase58: () => name },
  isDelegated: !!delegatedTo,
  delegatedSubDao: delegatedTo ? mockKey(delegatedTo) : null,
  isProxiedToMe: false,
  lockup: { kind: { constant: {} }, endTs: undefined },
})

// The provider memoizes its value: one object per positions list.
const mockGovernanceFor = (positions: Position[]) => ({
  mint: { equals: () => true, toBase58: () => 'hnt-mint' },
  registrar: undefined,
  loading: false,
  refetch: () => {},
  positions,
})
let mockGovernance = mockGovernanceFor([])
jest.mock(
  '@storage/GovernanceProvider',
  () => ({ useGovernance: () => mockGovernance }),
  { virtual: true },
)

const mockMutation = {
  prepare: () => Promise.resolve(),
  submit: () => Promise.resolve(),
  error: undefined,
  isPending: false,
  estimatedSolFee: undefined,
}
jest.mock(
  '@hooks/useGovernanceMutations',
  () => ({
    useCreatePositionMutation: () => mockMutation,
    useClaimRewardsMutation: () => mockMutation,
    useDelegatePositionMutation: () => mockMutation,
  }),
  { virtual: true },
)
const mockDelegations = { delegations: {}, refetch: () => Promise.resolve() }
jest.mock(
  '@hooks/usePositionDelegations',
  () => ({ usePositionDelegations: () => mockDelegations }),
  { virtual: true },
)
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => {} }), {
  virtual: true,
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'HNT' }) }),
  { virtual: true },
)
jest.mock('@helium/helium-react-hooks', () => ({
  useOwnedAmount: () => ({}),
  useSolanaUnixNow: () => undefined,
}))
jest.mock('@helium/spl-utils', () => ({
  HNT_MINT: { equals: () => true },
  humanReadable: () => '0',
  toBN: () => 0,
  toNumber: () => 0,
}))
jest.mock('@solana/spl-token', () => ({ NATIVE_MINT: 'sol' }))
jest.mock(
  '@utils/dateTools',
  () => ({ daysToSecs: () => 0, getFormattedStringFromDays: () => '' }),
  { virtual: true },
)
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: () => {} }),
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock(
  '@ui/BlurActionSheet',
  () => ({
    BlurActionSheet: ({ children }: { children: React.ReactNode }) => children,
  }),
  { virtual: true },
)
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Dot', () => ({ Dot: 'Dot' }), { virtual: true })
jest.mock('@ui/ListItem', () => ({ ListItem: 'ListItem' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
jest.mock('@ui/buttonVariants', () => ({ buttonTextVariants: () => '' }), {
  virtual: true,
})
jest.mock('../GovernanceWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}))
jest.mock('../PositionsList', () => ({ PositionsList: 'PositionsList' }))
jest.mock('../VotingPowerCard', () => ({ VotingPowerCard: 'VotingPowerCard' }))
jest.mock('../LockTokensModal', () => ({
  __esModule: true,
  default: 'LockTokensModal',
}))
jest.mock('../ClaimingRewardsModal', () => ({
  ClaimingRewardsModal: 'ClaimingRewardsModal',
}))
jest.mock('../DelegateTokensModal', () => ({
  DelegateTokensModal: 'DelegateTokensModal',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(<PositionsScreen />)
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

const delegateAllSubDaoName = (renderer: TestRenderer.ReactTestRenderer) =>
  renderer.root.findByType('DelegateTokensModal' as never).props.subDao
    ?.dntMetadata.name

describe('PositionsScreen', () => {
  it('renders an empty wallet', async () => {
    mockGovernance = mockGovernanceFor([])
    const renderer = await render()

    expect(
      renderer.root.findAllByProps({ testID: 'Positions.Manage' }),
    ).toHaveLength(0)
  })

  it('defaults delegate all to the sub DAO most positions delegate to', async () => {
    mockGovernance = mockGovernanceFor([mockPosition('a')])
    const renderer = await render()
    await act(async () => {
      renderer.root
        .findByProps({ testID: 'Positions.Manage.delegate' })
        .props.onPress()
    })

    // No delegated positions: MOBILE.
    expect(delegateAllSubDaoName(renderer)).toBe('Helium Mobile')

    mockGovernance = mockGovernanceFor([
      mockPosition('a', 'iot'),
      mockPosition('b', 'iot'),
      mockPosition('c', 'mobile'),
    ])
    await act(async () => {
      renderer.update(<PositionsScreen />)
    })

    // Two of three delegate to IOT.
    expect(delegateAllSubDaoName(renderer)).toBe('Helium IOT')
  })

  it('keeps the sub DAO the user picks in delegate all', async () => {
    mockGovernance = mockGovernanceFor([mockPosition('a')])
    const renderer = await render()
    await act(async () => {
      renderer.root
        .findByProps({ testID: 'Positions.Manage.delegate' })
        .props.onPress()
    })

    expect(delegateAllSubDaoName(renderer)).toBe('Helium Mobile')

    await act(async () => {
      renderer.root
        .findByType('DelegateTokensModal' as never)
        .props.setSubDao(mockSubDaos.result[1])
    })

    expect(delegateAllSubDaoName(renderer)).toBe('Helium IOT')
  })
})
