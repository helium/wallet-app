import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import ClaimingRewardsScreen from '../ClaimingRewardsScreen'

const mockTriggerNotification = jest.fn()
let mockReducedMotion = false
let mockBatchStatus: { status?: string; isLoading: boolean; error?: Error }

// The real reveal, so the test proves the confirmed view mounts inside it.
jest.mock(
  '@ui/SuccessReveal',
  () => jest.requireActual('../../../ui/SuccessReveal'),
  { virtual: true },
)
jest.mock(
  '@hooks/useHaptic',
  () => () => ({ triggerNotification: mockTriggerNotification }),
  { virtual: true },
)
jest.mock(
  '@theme/motion',
  () => ({
    DUR: { enter: 200 },
    EASE_OUT: 'easeOut',
    FADE_IN: 'FADE_IN',
    FADE_OUT: 'FADE_OUT',
    SPRING: { snap: {} },
    useReducedMotion: () => mockReducedMotion,
  }),
  { virtual: true },
)
jest.mock('react-native-reanimated', () => {
  const chain = { duration: () => ({ delay: () => 'rowEntering' }) }
  return {
    __esModule: true,
    default: { View: 'Animated.View' },
    FadeInDown: chain,
    ReduceMotion: { Never: 'never' },
    useAnimatedStyle: () => ({}),
    useSharedValue: (value: unknown) => ({ get: () => value, set: () => {} }),
    withSpring: () => 1,
    withTiming: () => 1,
  }
})
jest.mock('../../../hooks/useTransactionBatchStatus', () => ({
  useTransactionBatchesStatus: () => mockBatchStatus,
}))
jest.mock('../../../storage/AccountStorageProvider', () => {
  const accountStorage = { currentAccount: { solanaAddress: 'wallet' } }
  return { useAccountStorage: () => accountStorage }
})
jest.mock('@react-navigation/native', () => {
  const navigation = { reset: jest.fn() }
  const route = { params: { batchIds: ['batch'] } }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock(
  '@helium/helium-react-hooks',
  () => ({ useSolOwnedAmount: () => ({ amount: undefined }) }),
  { virtual: true },
)
jest.mock('@hooks/useBN', () => ({ useBN: () => undefined }), {
  virtual: true,
})
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock(
  '@utils/solanaUtils',
  () => ({
    parseTransactionError: (_balance: unknown, message: string) => message,
  }),
  { virtual: true },
)
jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/buttonVariants', () => ({ buttonTextVariants: () => '' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  { virtual: true },
)
jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
  CircleCheck: 'CircleCheck',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))
jest.mock('text-encoding-polyfill', () => ({}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = () => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(<ClaimingRewardsScreen />)
  })
  return renderer.root
}

const text = (root: TestRenderer.ReactTestInstance, key: string) =>
  root.find(
    (node) => (node.type as string) === 'Text' && node.props.children === key,
  )

beforeEach(() => {
  mockTriggerNotification.mockClear()
  mockReducedMotion = false
  mockBatchStatus = { status: 'confirmed', isLoading: false }
})

describe('ClaimingRewardsScreen', () => {
  it('reveals the confirmed claim with one success haptic', () => {
    const root = render()

    // Title and body enter as staggered reveal rows, below a success icon.
    const title = text(root, 'collectablesScreen.claimComplete')
    const body = text(root, 'collectablesScreen.claimCompleteBody')
    expect(title.parent?.type).toBe('Animated.View')
    expect(title.parent?.props.entering).toBe('rowEntering')
    expect(body.parent?.type).toBe('Animated.View')
    expect(body.parent?.props.entering).toBe('rowEntering')
    expect(root.findAllByType('CircleCheck' as never)).toHaveLength(1)
    expect(mockTriggerNotification.mock.calls).toEqual([['success']])
  })

  it('fades the rows in without a stagger under reduced motion', () => {
    mockReducedMotion = true
    const root = render()

    expect(
      text(root, 'collectablesScreen.claimComplete').parent?.props.entering,
    ).toBe('FADE_IN')
    expect(
      text(root, 'collectablesScreen.claimCompleteBody').parent?.props.entering,
    ).toBe('FADE_IN')
    expect(mockTriggerNotification.mock.calls).toEqual([['success']])
  })

  it('shows no reveal while the claim is pending', () => {
    mockBatchStatus = { status: 'pending', isLoading: false }
    const root = render()

    expect(root.findAllByType('CircleCheck' as never)).toHaveLength(0)
    expect(mockTriggerNotification).not.toHaveBeenCalled()
  })
})
