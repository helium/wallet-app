import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { TokenListGovItem, TokenListItem } from '../TokenListItem'

const mockNavigate = jest.fn()

// A list row must not fetch: each hook of these modules throws if the row
// calls it. The list calls them once for all rows.
function mockThrows(name: string) {
  return () => {
    throw new Error(`a token row called ${name}`)
  }
}

jest.mock('@helium/helium-react-hooks', () => ({
  useMint: mockThrows('useMint'),
  useOwnedAmount: mockThrows('useOwnedAmount'),
}))
jest.mock('@helium/voter-stake-registry-hooks', () => ({
  useHeliumVsrState: mockThrows('useHeliumVsrState'),
  usePositions: mockThrows('usePositions'),
  useRegistrarForMint: mockThrows('useRegistrarForMint'),
}))
jest.mock('@helium/voter-stake-registry-sdk', () => ({
  getPositionKeysForOwner: mockThrows('getPositionKeysForOwner'),
}))
jest.mock('@tanstack/react-query', () => ({
  useQuery: mockThrows('useQuery'),
}))
jest.mock(
  '@hooks/useCurrentWallet',
  () => ({ useCurrentWallet: mockThrows('useCurrentWallet') }),
  { virtual: true },
)
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: mockThrows('useMetaplexMetadata') }),
  { virtual: true },
)
jest.mock(
  '@hooks/usePrevious',
  () => ({ __esModule: true, default: mockThrows('usePrevious') }),
  { virtual: true },
)
jest.mock('../../../solana/SolanaProvider', () => ({
  useSolana: mockThrows('useSolana'),
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}))
jest.mock(
  '@utils/solanaUtils',
  () => ({
    humanReadable: (amount: BN, decimals: number) =>
      `${amount.toString()}e-${decimals}`,
  }),
  { virtual: true },
)
jest.mock(
  '@utils/constants',
  () => ({ MIN_BALANCE_THRESHOLD: 0.02 * 1000000000 }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ FADE_IN: {}, FADE_OUT: {} }), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/TokenIcon', () => ({ TokenIcon: 'TokenIcon' }), {
  virtual: true,
})
jest.mock('../AccountTokenCurrencyBalance', () => ({
  __esModule: true,
  default: 'AccountTokenCurrencyBalance',
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  ChevronRight: 'ChevronRight',
  Lock: 'Lock',
  TriangleAlert: 'TriangleAlert',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const HNT = new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux')
const MOBILE = new PublicKey('mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6')
const SOL = new PublicKey('So11111111111111111111111111111111111111112')

const render = (element: React.ReactElement) => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    renderer = TestRenderer.create(element)
  })
  if (!renderer) throw new Error('render failed')
  return renderer
}

const textOf = (root: TestRenderer.ReactTestInstance) =>
  root.findAllByType('Text' as never).map((n) => n.props.children)

beforeEach(() => mockNavigate.mockClear())

describe('TokenListItem', () => {
  it('renders a balance from plain props and opens the token', () => {
    const { root } = render(
      <TokenListItem
        mint={HNT}
        symbol="HNT"
        image="hnt.png"
        loadingMetadata={false}
        amount={BigInt(150000000)}
        decimals={8}
        loadingOwned={false}
      />,
    )

    expect(textOf(root)).toEqual(['150000000e-8 ', 'HNT'])
    expect(root.findByType('TokenIcon' as never).props.img).toBe('hnt.png')
    expect(
      root.findByType('AccountTokenCurrencyBalance' as never).props.ticker,
    ).toBe('HNT')

    act(() => {
      root.find((n) => n.props.testID === 'TokenListItem.HNT').props.onPress()
    })
    expect(mockNavigate).toHaveBeenCalledWith('AccountTokenScreen', {
      mint: HNT.toBase58(),
    })
  })

  it('warns when the SOL balance is under the threshold', () => {
    const { root } = render(
      <TokenListItem
        mint={SOL}
        symbol="SOL"
        loadingMetadata={false}
        amount={BigInt(1000)}
        decimals={9}
        loadingOwned={false}
      />,
    )

    expect(root.findAllByType('TriangleAlert' as never)).toHaveLength(1)
  })

  it('hides an empty MOBILE balance', () => {
    const renderer = render(
      <TokenListItem
        mint={MOBILE}
        symbol="MOBILE"
        loadingMetadata={false}
        decimals={6}
        loadingOwned={false}
      />,
    )

    expect(renderer.toJSON()).toBeNull()
  })
})

describe('TokenListGovItem', () => {
  it('renders a locked balance from plain props and opens the positions', () => {
    const { root } = render(
      <TokenListGovItem
        mint={HNT}
        symbol="HNT"
        image="hnt.png"
        loadingMetadata={false}
        decimals={8}
        amountLocked={new BN(250000000)}
        loadingAmount={false}
      />,
    )

    expect(textOf(root)).toEqual(['250000000e-8 ', ['HNT', ' (Locked)'], '-'])

    act(() => {
      root.findByType('PressableScale' as never).props.onPress()
    })
    expect(mockNavigate).toHaveBeenCalledWith('Governance', {
      screen: 'PositionsScreen',
      initial: false,
      params: { mint: HNT.toBase58() },
    })
  })
})
