import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { WalletSignBottomSheetCompact } from '../WalletSignBottomSheetCompact'
import { WalletStandardMessageTypes } from '../walletSignBottomSheetTypes'

// A 1 SOL balance covers the fee, so no funds warning shows.
jest.mock(
  '@hooks/useBN',
  () => ({ useBN: () => ({ toString: () => '1000000000' }) }),
  {
    virtual: true,
  },
)
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock('@helium/helium-react-hooks', () => ({
  useSolOwnedAmount: () => ({ amount: undefined }),
}))
jest.mock(
  '@hooks/useRentExempt',
  () => ({ useRentExempt: () => ({ rentExempt: '', rentExemptLamports: 0 }) }),
  { virtual: true },
)
jest.mock('@utils/formatting', () => ({ humanReadable: () => '0.000005' }), {
  virtual: true,
})
jest.mock(
  '@utils/solanaUtils',
  () => ({ estimateTxnFeeLamports: () => 5000, TXN_FEE_IN_LAMPORTS: 5000 }),
  { virtual: true },
)
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('WalletSignBottomSheetCompact', () => {
  it('shows a non-empty warning and message', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <WalletSignBottomSheetCompact
          type={WalletStandardMessageTypes.signTransaction}
          serializedTxs={[Buffer.from('tx')]}
          warning="Check the recipient"
          message="Send 1 HNT"
          onSimulate={() => {}}
          onAccept={() => {}}
          onCancel={() => {}}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')

    expect(
      renderer.root.findAllByType('Text' as never).map((n) => n.props.children),
    ).toEqual(expect.arrayContaining(['Check the recipient', 'Send 1 HNT']))
  })
})
