import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import PaymentSubmit from '../PaymentSubmit'

const mockNavigation = { goBack: jest.fn() }
const mockTriggerNotification = jest.fn()

// The real reveal, so the test proves the success view mounts inside it.
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
    SPRING: { snap: {} },
    useReducedMotion: () => false,
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
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('../PaymentSummary', () => 'PaymentSummary')
jest.mock(
  '@helium/helium-react-hooks',
  () => ({ useOwnedAmount: () => ({ amount: undefined }) }),
  { virtual: true },
)
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
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}))
jest.mock('lucide-react-native', () => ({
  CircleCheck: 'CircleCheck',
  CircleX: 'CircleX',
}))
jest.mock('uniwind', () => ({ withUniwind: (icon: unknown) => icon }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

type Settled = { succeeded?: boolean; error?: Error }

const props = {
  mint: PublicKey.default,
  totalBalance: new BN(1),
  payments: [],
  actionTitle: 'payment.backToAccounts',
}

// Mounts the overlay while the send runs, then settles it as given.
const render = (
  settled: Settled,
  handlers: { onSuccess?: () => void; onRetry?: () => void } = {},
) => {
  const onSuccess = handlers.onSuccess ?? jest.fn()
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <PaymentSubmit {...props} submitLoading onSuccess={onSuccess} />,
    )
  })
  act(() => {
    renderer.update(
      <PaymentSubmit
        {...props}
        submitLoading={false}
        submitSucceeded={settled.succeeded}
        submitError={settled.error}
        onSuccess={onSuccess}
        onRetry={handlers.onRetry}
      />,
    )
  })
  return renderer.root
}

const byTestID = (root: TestRenderer.ReactTestInstance, testID: string) =>
  root.find(
    (node) => typeof node.type === 'string' && node.props.testID === testID,
  )

const button = (root: TestRenderer.ReactTestInstance, label: string) =>
  root.find(
    (node) =>
      (node.type as string) === 'Button' && node.props.children === label,
  )

beforeEach(() => {
  mockNavigation.goBack.mockClear()
  mockTriggerNotification.mockClear()
})

describe('PaymentSubmit', () => {
  it('reveals the success view with one success haptic', () => {
    const root = render({ succeeded: true })

    const title = byTestID(root, 'PaymentSuccess.Title')
    expect(title.props.children).toBe('payment.submitSuccess')
    // The title enters as a reveal row, not as a plain child.
    expect(title.parent?.type).toBe('Animated.View')
    expect(title.parent?.props.entering).toBe('rowEntering')
    expect(mockTriggerNotification.mock.calls).toEqual([['success']])
  })

  it('leaves through Done', () => {
    const onSuccess = jest.fn()
    const root = render({ succeeded: true }, { onSuccess })

    const done = byTestID(root, 'PaymentSuccess.Done')
    expect(done.props.children).toBe('payment.backToAccounts')
    act(() => {
      done.props.onPress()
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('leaves once when Done is pressed twice in one tick', () => {
    const onSuccess = jest.fn()
    const root = render({ succeeded: true }, { onSuccess })

    const done = byTestID(root, 'PaymentSuccess.Done')
    act(() => {
      done.props.onPress()
      done.props.onPress()
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows the error with Cancel and Retry', () => {
    const onRetry = jest.fn()
    const root = render({ error: new Error('boom') }, { onRetry })

    expect(
      root.findAll(
        (node) =>
          (node.type as string) === 'Text' && node.props.children === 'boom',
      ),
    ).toHaveLength(1)
    expect(mockTriggerNotification).not.toHaveBeenCalled()

    act(() => {
      button(root, 'generic.cancel').props.onPress()
    })
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1)
    act(() => {
      button(root, 'generic.retry').props.onPress()
    })
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
