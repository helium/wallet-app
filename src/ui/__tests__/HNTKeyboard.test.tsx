import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import type { PublicKey } from '@solana/web3.js'
import { HNTKeyboard, type HNTKeyboardRef } from '../HNTKeyboard'

const mockPresent = jest.fn()
const mockDismiss = jest.fn()

// The node test runner cannot load gorhom, react-native, lucide or uniwind.
// The modal exposes present and dismiss, and renders its handle, backdrop and
// content so the test can press them.
jest.mock('@gorhom/bottom-sheet', () => {
  const ReactActual = jest.requireActual('react')
  const BottomSheetModal = ReactActual.forwardRef(
    (
      {
        children,
        handleComponent: Handle,
        backdropComponent: Backdrop,
      }: {
        children: React.ReactNode
        handleComponent: React.ComponentType
        backdropComponent: React.ComponentType
      },
      ref: unknown,
    ) => {
      ReactActual.useImperativeHandle(ref, () => ({
        present: mockPresent,
        dismiss: mockDismiss,
      }))
      return ReactActual.createElement(
        'BottomSheetModal',
        null,
        ReactActual.createElement(Handle),
        ReactActual.createElement(Backdrop),
        children,
      )
    },
  )
  return {
    BottomSheetModal,
    BottomSheetBackdrop: 'BottomSheetBackdrop',
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    BottomSheetView: 'BottomSheetView',
  }
})
jest.mock('../RootPortal', () => ({ RootPortal: 'RootPortal' }))
jest.mock('@helium/helium-react-hooks', () => ({
  useMint: () => ({ info: { decimals: 8 } }),
  // 500 HNT
  useOwnedAmount: () => ({ amount: BigInt(50000000000) }),
  useSolOwnedAmount: () => ({ amount: BigInt(0) }),
}))
jest.mock('@solana/spl-token', () => ({ NATIVE_MINT: 'native' }))
jest.mock(
  '@hooks/useBackHandler',
  () => () => ({ handleDismiss: jest.fn(), setIsShowing: jest.fn() }),
  { virtual: true },
)
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => 'me' }), {
  virtual: true,
})
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'HNT', loading: false }) }),
  { virtual: true },
)
jest.mock('@utils/layout', () => ({ useContentColumnMargins: () => ({}) }), {
  virtual: true,
})
jest.mock(
  '@utils/i18n',
  () => ({ decimalSeparator: '.', groupSeparator: ',' }),
  { virtual: true },
)
jest.mock('../../utils/i18n', () => ({
  decimalSeparator: '.',
  groupSeparator: ',',
}))
// solanaUtils' humanReadable is the same function as formatting's, which
// loads without the Solana programs.
jest.mock(
  '@utils/solanaUtils',
  () => jest.requireActual('../../utils/formatting'),
  { virtual: true },
)
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({ Platform: { OS: 'ios' }, View: 'View' }))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0 }),
}))
jest.mock('lucide-react-native', () => ({ ArrowUpRight: 'ArrowUpRight' }))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('../AccountIcon', () => ({ AccountIcon: 'AccountIcon' }))
jest.mock('../Button', () => ({ Button: 'Button' }))
jest.mock('../ContentColumn', () => ({ useSheetMargins: () => undefined }))
jest.mock('../Keypad', () => ({ Keypad: 'Keypad' }))
jest.mock('../PressableScale', () => ({ PressableScale: 'PressableScale' }))
jest.mock('../Sheet', () => ({
  SheetBackground: 'SheetBackground',
  SheetHandle: 'SheetHandle',
}))
jest.mock('../Text', () => ({ Text: 'Text' }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const MINT = { equals: () => false } as unknown as PublicKey
const FEE = new BN(5000)
const PAYER = { address: 'payer', solanaAddress: 'payer' } as never

type Rendered = TestRenderer.ReactTestRenderer

const render = (props: Partial<React.ComponentProps<typeof HNTKeyboard>>) => {
  const ref = React.createRef<HNTKeyboardRef>()
  const onConfirmBalance = jest.fn()
  let renderer!: Rendered
  act(() => {
    renderer = TestRenderer.create(
      <HNTKeyboard
        ref={ref}
        mint={MINT}
        onConfirmBalance={onConfirmBalance}
        {...props}
      >
        <View testID="child" />
      </HNTKeyboard>,
    )
  })
  return { renderer, ref, onConfirmBalance }
}

const View = 'View' as unknown as React.ElementType

const byTestID = (renderer: Rendered, testID: string) =>
  renderer.root.find((node) => node.props.testID === testID)

const press = (renderer: Rendered, ...keys: (number | string)[]) =>
  keys.forEach((key) => {
    act(() => {
      renderer.root
        .findByType('Keypad' as unknown as React.ElementType)
        .props.onPress(key)
    })
  })

const amount = (renderer: Rendered) =>
  renderer.root
    .findAllByType('Text' as unknown as React.ElementType)
    .map((node) => node.props.children)
    .find((children) => typeof children === 'string' && /HNT$/.test(children))

const confirm = (renderer: Rendered) =>
  byTestID(renderer, 'HNTKeyboard.Confirm')

beforeEach(() => {
  mockPresent.mockClear()
  mockDismiss.mockClear()
})

describe('HNTKeyboard', () => {
  it('presents the sheet on show and starts from the given balance', () => {
    const { renderer, ref } = render({})
    act(() => ref.current?.show({ balance: new BN(150000000) }))

    expect(mockPresent).toHaveBeenCalledTimes(1)
    expect(amount(renderer)).toBe('1.5 HNT')
  })

  it('confirms the typed amount as base units for the payee', () => {
    const { renderer, ref, onConfirmBalance } = render({})
    act(() => ref.current?.show({ payee: 'payee' }))
    press(renderer, 1, 2, 'decimal', 5)

    expect(amount(renderer)).toBe('12.5 HNT')
    act(() => {
      confirm(renderer).props.onPress()
    })

    const [[opts]] = onConfirmBalance.mock.calls
    expect(opts.balance.toString()).toBe('1250000000')
    expect(opts).toMatchObject({ payee: 'payee', max: false })
    expect(mockDismiss).toHaveBeenCalled()
  })

  it('drops the last digit on backspace and falls back to 0', () => {
    const { renderer, ref } = render({})
    act(() => ref.current?.show({}))
    press(renderer, 7, 'backspace')
    expect(amount(renderer)).toBe('0 HNT')

    press(renderer, 4, 2, 'backspace')
    expect(amount(renderer)).toBe('4 HNT')
  })

  it("ignores digits past the mint's decimals", () => {
    const { renderer, ref } = render({})
    act(() => ref.current?.show({}))
    press(renderer, 'decimal', 1, 2, 3, 4, 5, 6, 7, 8, 9)

    expect(amount(renderer)).toBe('0.12345678 HNT')
  })

  it('disables Confirm when the payer lacks the balance, unless overdraft is allowed', () => {
    const short = render({ networkFee: FEE })
    act(() => short.ref.current?.show({ payer: PAYER }))
    press(short.renderer, 6, 0, 0)
    expect(confirm(short.renderer).props.disabled).toBe(true)

    const overdraft = render({ networkFee: FEE, allowOverdraft: true })
    act(() => overdraft.ref.current?.show({ payer: PAYER }))
    press(overdraft.renderer, 6, 0, 0)
    expect(confirm(overdraft.renderer).props.disabled).toBe(false)

    press(short.renderer, 'backspace')
    expect(confirm(short.renderer).props.disabled).toBe(false)
  })

  it("fills the payer's balance on Max and confirms it as max", () => {
    const { renderer, ref, onConfirmBalance } = render({ networkFee: FEE })
    act(() => ref.current?.show({ payer: PAYER, payee: 'payee' }))
    act(() => {
      renderer.root
        .findByType('PressableScale' as unknown as React.ElementType)
        .props.onPress()
    })

    expect(amount(renderer)).toBe('500 HNT')
    act(() => {
      confirm(renderer).props.onPress()
    })
    const [[opts]] = onConfirmBalance.mock.calls
    expect(opts.balance.toString()).toBe('50000000000')
    expect(opts.max).toBe(true)
  })

  const pressMax = (renderer: Rendered) =>
    act(() => {
      renderer.root
        .findByType('PressableScale' as unknown as React.ElementType)
        .props.onPress()
    })

  it('holds back minTokens from the Max amount', () => {
    const { renderer, ref } = render({
      networkFee: FEE,
      minTokens: new BN(100000000),
    })
    act(() => ref.current?.show({ payer: PAYER }))
    pressMax(renderer)

    expect(amount(renderer)).toBe('499 HNT')
  })

  it('holds back the network fee from a native SOL Max amount', () => {
    const { renderer, ref } = render({
      mint: { equals: () => true } as unknown as PublicKey,
      networkFee: FEE,
      actionableAmount: new BN(100005000),
    })
    act(() => ref.current?.show({ payer: PAYER }))
    pressMax(renderer)

    expect(amount(renderer)).toBe('1 HNT')
  })

  it('clamps Max to 0 when the fee exceeds the balance', () => {
    const { renderer, ref } = render({
      mint: { equals: () => true } as unknown as PublicKey,
      networkFee: FEE,
      actionableAmount: new BN(1000),
    })
    act(() => ref.current?.show({ payer: PAYER }))
    pressMax(renderer)

    expect(amount(renderer)).toBe('0 HNT')
  })

  it('renders children beside the sheet and merges the caller className', () => {
    const { renderer } = render({ className: 'bg-secondary' })
    const [root] = renderer.root.findAllByType(View)

    expect(root.props.className).toContain('flex-1')
    expect(root.props.className).toContain('bg-secondary')
    expect(byTestID(renderer, 'child')).toBeTruthy()
    expect(
      renderer.root.findAllByType('RootPortal' as unknown as React.ElementType),
    ).toHaveLength(0)
  })

  it('mounts the sheet in a portal and keeps children outside it with usePortal', () => {
    const { renderer } = render({ usePortal: true })
    const portal = renderer.root.findByType(
      'RootPortal' as unknown as React.ElementType,
    )

    expect(
      portal.findAll((node) => node.props.testID === 'child'),
    ).toHaveLength(0)
    expect(byTestID(renderer, 'child')).toBeTruthy()
  })
})
