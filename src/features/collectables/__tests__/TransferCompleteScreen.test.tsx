import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import TransferCompleteScreen from '../TransferCompleteScreen'

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
  useTransactionBatchStatus: () => mockBatchStatus,
}))
jest.mock('@react-navigation/native', () => {
  const navigation = { reset: jest.fn() }
  const route = {
    params: { collectable: { json: { image: 'nft.png' } }, batchId: 'batch' },
  }
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
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/buttonVariants', () => ({ buttonTextVariants: () => '' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/twMerge', () => ({ twMerge: () => '' }), { virtual: true })
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }))
jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
  CircleCheck: 'CircleCheck',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  Image: 'Image',
  LogBox: { ignoreLogs: () => {} },
  Platform: { OS: 'ios' },
  View: 'View',
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('text-encoding-polyfill', () => ({}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../../../utils/layout', () => ({ useContentWidth: () => 400 }))
jest.mock('../components/BackHeader', () => 'BackHeader')

// Tell React that this runner wraps renders in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = () => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(<TransferCompleteScreen />)
  })
  return renderer.root
}

const title = (root: TestRenderer.ReactTestInstance) =>
  root.find(
    (node) =>
      (node.type as string) === 'Text' &&
      node.props.children === 'collectablesScreen.transferComplete',
  )

beforeEach(() => {
  mockTriggerNotification.mockClear()
  mockReducedMotion = false
  mockBatchStatus = { status: 'confirmed', isLoading: false }
})

describe('TransferCompleteScreen', () => {
  it('reveals the confirmed transfer with one success haptic', () => {
    const root = render()

    // The title enters as a reveal row, below a success icon.
    expect(title(root).parent?.type).toBe('Animated.View')
    expect(title(root).parent?.props.entering).toBe('rowEntering')
    expect(root.findAllByType('CircleCheck' as never)).toHaveLength(1)
    expect(mockTriggerNotification.mock.calls).toEqual([['success']])
  })

  it('fades the title in without a stagger under reduced motion', () => {
    mockReducedMotion = true
    const root = render()

    expect(title(root).parent?.props.entering).toBe('FADE_IN')
    expect(mockTriggerNotification.mock.calls).toEqual([['success']])
  })

  it('shows no reveal while the transfer is pending', () => {
    mockBatchStatus = { status: 'pending', isLoading: false }
    const root = render()

    expect(root.findAllByType('CircleCheck' as never)).toHaveLength(0)
    expect(mockTriggerNotification).not.toHaveBeenCalled()
  })
})
