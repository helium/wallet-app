import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import PaymentCard from '../PaymentCard'

jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/SubmitButton', () => ({ SubmitButton: 'SubmitButton' }), {
  virtual: true,
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'HNT' }) }),
  { virtual: true },
)
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ currentAccount: { address: 'payer' } }),
}))
jest.mock('../../../storage/secureStorage', () => ({
  checkSecureAccount: () => Promise.resolve(true),
}))
jest.mock('../../../utils/animateTransition', () => () => undefined)
jest.mock('../PaymentSummary', () => 'PaymentSummary')
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// Mounts the card, presses Pay, and returns the swipe rail it shows.
const swipeRail = async (disabled: boolean) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(
      <PaymentCard
        handleCancel={jest.fn()}
        totalBalance={new BN(1)}
        onSubmit={jest.fn()}
        disabled={disabled}
        mint={PublicKey.default}
        payments={[]}
      />,
    )
  })
  const pay = renderer.root.find(
    (node) =>
      (node.type as string) === 'Button' &&
      node.props.testID === 'PaymentCard.Pay',
  )
  await act(async () => pay.props.onPress())
  return renderer.root.find((node) => (node.type as string) === 'SubmitButton')
}

describe('PaymentCard', () => {
  it('disables the swipe rail while the card is disabled', async () => {
    expect((await swipeRail(true)).props.disabled).toBe(true)
    expect((await swipeRail(false)).props.disabled).toBe(false)
  })
})
