import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { WalletSignBottomSheetSimulated } from '../WalletSIgnBottomSheetSimulated'
import { WalletStandardMessageTypes } from '../walletSignBottomSheetTypes'

// One simulated transaction with the 5000-lamport base fee and no
// priority fee.
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) =>
    queryKey[0] === 'walletSignSimulation'
      ? {
          data: [{ solFee: 5000, priorityFee: 0, warnings: [] }],
          error: null,
          isLoading: false,
        }
      : { data: [] },
}))
// The real formatter, with the separators of an en-US locale.
jest.mock(
  '@utils/formatting',
  () => jest.requireActual('../../utils/formatting'),
  { virtual: true },
)
jest.mock('../../utils/i18n', () => ({
  groupSeparator: ',',
  decimalSeparator: '.',
}))
jest.mock('@helium/helium-react-hooks', () => ({
  useSolOwnedAmount: () => ({ amount: undefined }),
}))
jest.mock('@helium/helium-entity-manager-sdk', () => ({
  entityCreatorKey: () => [],
}))
jest.mock('@helium/sus', () => ({ sus: () => Promise.resolve([]) }))
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
// The SOL balance, unknown unless a test sets it.
let mockSolBalance: { toString: () => string } | undefined
jest.mock('@hooks/useBN', () => ({ useBN: () => mockSolBalance }), {
  virtual: true,
})
jest.mock(
  '@hooks/useRentExempt',
  () => ({ useRentExempt: () => ({ rentExempt: '', rentExemptLamports: 0 }) }),
  { virtual: true },
)
jest.mock('@utils/constants', () => ({ DAO_KEY: undefined }), {
  virtual: true,
})
jest.mock('@ui/SubmitButton', () => ({ SubmitButton: 'SubmitButton' }), {
  virtual: true,
})
jest.mock('@ui/WarningPill', () => ({ WarningPill: 'WarningPill' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock(
  '@ui/twMerge',
  () => ({ twMerge: (...classes: unknown[]) => classes.join(' ') }),
  { virtual: true },
)
jest.mock('../canopyBlacklist', () => ({ fetchCanopyBlacklist: () => [] }))
jest.mock('../SolanaProvider', () => ({
  useSolana: () => ({ connection: undefined, cluster: 'mainnet-beta' }),
}))
jest.mock('../WalletSignBottomSheetTransaction', () => ({
  __esModule: true,
  default: 'WalletSignBottomSheetTransaction',
}))
jest.mock('lucide-react-native', () => ({
  Check: 'Check',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  CornerDownRight: 'CornerDownRight',
  Info: 'Info',
  X: 'X',
}))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ View: 'View' }))
jest.mock('react-native-gesture-handler', () => ({ ScrollView: 'ScrollView' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

describe('WalletSignBottomSheetSimulated', () => {
  it('shows a fee under 0.0001 SOL at full precision', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <WalletSignBottomSheetSimulated
          type={WalletStandardMessageTypes.signTransaction}
          serializedTxs={[Buffer.from('tx')]}
          onAccept={() => {}}
          onCancel={() => {}}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')

    expect(
      renderer.root.findAllByType('Text' as never).map((n) => n.props.children),
    ).toContain('~0.000005 SOL')
  })

  it('wires Cancel to onCancel and Approve to onAccept', () => {
    const onAccept = jest.fn()
    const onCancel = jest.fn()
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <WalletSignBottomSheetSimulated
          type={WalletStandardMessageTypes.signTransaction}
          serializedTxs={[Buffer.from('tx')]}
          onAccept={onAccept}
          onCancel={onCancel}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')
    const { root } = renderer
    const buttonWithText = (label: string) =>
      root.find(
        (n) => (n.type as unknown) === 'Button' && n.props.children === label,
      )

    act(() => {
      buttonWithText('browserScreen.cancel').props.onPress()
    })
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onAccept).not.toHaveBeenCalled()

    onCancel.mockClear()
    act(() => {
      buttonWithText('browserScreen.approve').props.onPress()
    })
    expect(onAccept).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('collapses the fee breakdown when the toggle is pressed twice before a render', () => {
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <WalletSignBottomSheetSimulated
          type={WalletStandardMessageTypes.signTransaction}
          serializedTxs={[Buffer.from('tx')]}
          onAccept={() => {}}
          onCancel={() => {}}
        />,
      )
    })
    if (!renderer) throw new Error('render failed')
    const texts = () =>
      renderer!.root.findAllByType('Text' as never).map((n) => n.props.children)
    const feeToggle = () =>
      renderer!.root.find(
        (n) =>
          (n.type as unknown) === 'PressableScale' &&
          n.findAll((c) => c.props.children === 'browserScreen.totalNetworkFee')
            .length > 0,
      ).props.onPress
    const onPress = feeToggle()

    act(() => {
      onPress()
      onPress()
    })
    expect(texts()).not.toContain('browserScreen.totalBaseFee')

    act(() => {
      feeToggle()()
    })
    expect(texts()).toContain('browserScreen.totalBaseFee')
  })

  it('shows a non-empty warning and message', () => {
    // 1 SOL covers the 5000-lamport fee, so the message shows.
    mockSolBalance = { toString: () => '1000000000' }
    let renderer: TestRenderer.ReactTestRenderer | undefined
    act(() => {
      renderer = TestRenderer.create(
        <WalletSignBottomSheetSimulated
          type={WalletStandardMessageTypes.signTransaction}
          serializedTxs={[Buffer.from('tx')]}
          warning="Check the recipient"
          message="Send 1 HNT"
          onAccept={() => {}}
          onCancel={() => {}}
        />,
      )
    })
    mockSolBalance = undefined
    if (!renderer) throw new Error('render failed')

    expect(
      renderer.root.findAllByType('Text' as never).map((n) => n.props.children),
    ).toEqual(expect.arrayContaining(['Check the recipient', 'Send 1 HNT']))
  })
})
