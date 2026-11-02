import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import EmailLoginStep from '../components/EmailLoginStep'

jest.mock('@privy-io/expo', () => ({
  usePrivy: () => ({ user: null, isReady: true }),
  useLoginWithEmail: () => ({
    sendCode: () => Promise.resolve(),
    loginWithCode: () => Promise.resolve(),
    state: { status: 'initial' },
  }),
  useLinkEmail: () => ({
    sendCode: () => Promise.resolve(),
    linkWithCode: () => Promise.resolve(),
    state: { status: 'initial' },
  }),
}))
// A 30 second wait before the first resend.
jest.mock('../logic/retry', () => ({ resendBackoffSeconds: () => 30 }))
jest.mock('@utils/logger', () => ({ error: () => {} }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/buttonVariants', () => ({ buttonTextVariants: () => '' }), {
  virtual: true,
})
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('../components/StepBackHeader', () => 'StepBackHeader')
jest.mock('../components/WorldLoader', () => 'WorldLoader')
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { seconds?: number }) =>
      opts?.seconds === undefined ? key : `${key} ${opts.seconds}`,
  }),
}))
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('EmailLoginStep', () => {
  it('counts down one second per second when renders lag behind the timer', async () => {
    let renderer!: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = TestRenderer.create(
        <EmailLoginStep onBack={() => {}} onSuccess={() => {}} />,
      )
    })
    act(() => {
      renderer.root.findByType('Input' as never).props.onChangeText('a@b.co')
    })
    await act(async () => {
      renderer.root.findByType('Button' as never).props.onPress()
    })
    const resendLabel = () =>
      renderer.root
        .findAllByType('Text' as never)
        .map((n) => n.props.children)
        .find(
          (c) =>
            typeof c === 'string' &&
            c.startsWith('migrateToWorld.linkEmail.resend'),
        )
    expect(resendLabel()).toBe('migrateToWorld.linkEmail.resendIn 30')

    // Three seconds pass with no render between the ticks.
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    expect(resendLabel()).toBe('migrateToWorld.linkEmail.resendIn 27')

    // The rest of the wait ends the countdown, and extra time keeps it at 0.
    act(() => {
      jest.advanceTimersByTime(40000)
    })
    expect(resendLabel()).toBe('migrateToWorld.linkEmail.resend')
  })
})
