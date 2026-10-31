import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import MemoInput from '../MemoInput'
import PaymentCard from '../PaymentCard'
import PaymentItem from '../PaymentItem'

jest.mock('@ui/AccountIcon', () => ({ AccountIcon: 'AccountIcon' }), {
  virtual: true,
})
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock(
  '@ui/twMerge',
  () => ({ twMerge: (...names: string[]) => names.join(' ') }),
  { virtual: true },
)
jest.mock('@ui/SubmitButton', () => ({ SubmitButton: 'SubmitButton' }), {
  virtual: true,
})
jest.mock('../PaymentSummary', () => 'PaymentSummary')
jest.mock('@helium/address', () => ({ isValid: () => false }), {
  virtual: true,
})
jest.mock('@helium/helium-react-hooks', () => ({ useMint: () => undefined }), {
  virtual: true,
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'SOL', loading: false }) }),
  { virtual: true },
)
jest.mock('@utils/formatting', () => ({ shortenAddress: (a: string) => a }), {
  virtual: true,
})
jest.mock('@utils/solanaUtils', () => ({ humanReadable: () => '1' }), {
  virtual: true,
})
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({ currentAccount: { address: 'me' } }),
}))
jest.mock('../../../storage/secureStorage', () => ({
  checkSecureAccount: async () => true,
}))
jest.mock('../../../utils/animateTransition', () => () => undefined)
jest.mock('../../../utils/Balance', () => ({
  useBalance: () => ({ dcToNetworkTokens: () => undefined }),
}))
jest.mock('../../../utils/accountUtils', () => ({
  accountNetType: () => 0,
  ellipsizeAddress: (a: string) => a,
  solAddressIsValid: () => false,
}))
jest.mock('use-debounce', () => ({ useDebounce: (value: string) => [value] }))
jest.mock('lucide-react-native', () => ({ CircleUser: 'CircleUser', X: 'X' }))
jest.mock('uniwind', () => ({ withUniwind: (icon: unknown) => icon }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  Keyboard: { dismiss: () => undefined },
  View: 'View',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(element)
  })
  return renderer.root
}

const byTestID = (root: TestRenderer.ReactTestInstance, testID: string) =>
  root.find(
    (node) => typeof node.type === 'string' && node.props.testID === testID,
  )

describe('PaymentItem', () => {
  it('edits the address and the amount through their Maestro targets', () => {
    const onEditAddress = jest.fn()
    const onEditAmount = jest.fn()
    const root = render(
      <PaymentItem
        index={0}
        hideMemo
        onAddressBookSelected={jest.fn()}
        onEditAddress={onEditAddress}
        onEditAmount={onEditAmount}
        handleAddressError={jest.fn()}
      />,
    )

    const input = byTestID(root, 'PaymentItem.Address')
    expect(input.type).toBe('Input')
    act(() => {
      input.props.onChangeText('abc')
    })
    expect(onEditAddress).toHaveBeenLastCalledWith({ address: 'abc', index: 0 })

    act(() => {
      byTestID(root, 'PaymentItem.Amount').props.onPress()
    })
    expect(onEditAmount).toHaveBeenCalledWith({ address: undefined, index: 0 })
  })

  it('shows the chosen address in the address field', () => {
    const root = render(
      <PaymentItem
        index={0}
        address="recipient"
        account={{ address: 'recipient' } as never}
        hideMemo
        onAddressBookSelected={jest.fn()}
        onEditAddress={jest.fn()}
        onEditAmount={jest.fn()}
        handleAddressError={jest.fn()}
      />,
    )

    expect(byTestID(root, 'PaymentItem.Address').props.value).toBe('recipient')
  })

  it('tints the row when the payment has an error', () => {
    const root = render(
      <PaymentItem
        index={0}
        hideMemo
        hasError
        onAddressBookSelected={jest.fn()}
        onEditAddress={jest.fn()}
        onEditAmount={jest.fn()}
        handleAddressError={jest.fn()}
      />,
    )

    expect(
      root.findAll(
        (node) =>
          (node.type as string) === 'View' &&
          node.props.className === 'absolute inset-0 bg-destructive/20',
      ),
    ).toHaveLength(1)
  })
})

describe('MemoInput', () => {
  const counterClass = (value: string) =>
    render(<MemoInput value={value} />).findByType('Text' as never).props
      .className

  it('accepts a memo of 8 bytes and flags one of 9', () => {
    expect(counterClass('12345678')).toBe('mr-4 text-foreground')
    expect(counterClass('123456789')).toBe('mr-4 text-destructive')
  })
})

describe('PaymentCard', () => {
  const props = {
    mint: PublicKey.default,
    totalBalance: new BN(1),
    payments: [],
    handleCancel: jest.fn(),
  }

  it('holds Pay while the form is invalid', () => {
    const root = render(
      <PaymentCard {...props} onSubmit={jest.fn()} disabled />,
    )
    expect(byTestID(root, 'PaymentCard.Pay').props.disabled).toBe(true)
  })

  it('swaps Pay for the slide to send, which submits', async () => {
    const onSubmit = jest.fn()
    const root = render(<PaymentCard {...props} onSubmit={onSubmit} />)

    await act(async () => byTestID(root, 'PaymentCard.Pay').props.onPress())
    const slider = root.findByType('SubmitButton' as never)
    slider.props.onSubmit()
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
