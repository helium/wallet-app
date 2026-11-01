import BN from 'bn.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import SwapNavigator from '../SwapNavigator'

// The ATA fee query, the cluster, and the mint accounts. The defaults leave
// the fee read and the mints unloaded on mainnet; a test may change them.
let mockAtaFeeQuery: { data?: BN; isLoading: boolean }
let mockIsDevnet: boolean
let mockMintsLoaded: boolean
// The SOL balance in lamports; unloaded unless a test sets it.
let mockSolAmount: bigint | undefined
beforeEach(() => {
  mockAtaFeeQuery = { data: undefined, isLoading: false }
  mockIsDevnet = false
  mockMintsLoaded = false
  mockSolAmount = undefined
})

// The stack renders its first screen, as the native stack does on open.
jest.mock('@react-navigation/native-stack', () => {
  const ReactActual = jest.requireActual('react')
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => {
        const [first] = ReactActual.Children.toArray(children) as {
          props: { component: React.ComponentType }
        }[]
        return ReactActual.createElement(first.props.component)
      },
      Screen: () => null,
    }),
  }
})

// useJupiter reads the context that JupiterProvider supplies and throws
// outside it, as the real hook does. The value is stable across renders.
jest.mock(
  '@storage/JupiterProvider',
  () => {
    const ReactActual = jest.requireActual('react')
    const JupiterContext = ReactActual.createContext(null)
    const jupiter = {
      loading: false,
      error: undefined,
      getRoute: () => Promise.resolve(undefined),
      getSwapTx: () => Promise.resolve(undefined),
    }
    return {
      JupiterProvider: ({ children }: { children: React.ReactNode }) =>
        ReactActual.createElement(
          JupiterContext.Provider,
          { value: jupiter },
          children,
        ),
      useJupiter: () => {
        const context = ReactActual.useContext(JupiterContext)
        if (!context) {
          throw new Error('useJupiter must be used within a JupiterProvider')
        }
        return context
      },
    }
  },
  { virtual: true },
)

jest.mock('../SwappingScreen', () => 'SwappingScreen')
jest.mock('../logic/ataCreationFeeQuery', () => ({
  ataCreationFeeQuery: () => ({}),
}))
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => mockAtaFeeQuery,
}))
jest.mock('@react-navigation/native', () => {
  const navigation = { goBack: () => {}, push: () => {} }
  return { useNavigation: () => navigation }
})

// Stable hook values: the screen's effects depend on them.
jest.mock('../../../solana/SolanaProvider', () => {
  const connection = {}
  return { useSolana: () => ({ isDevnet: mockIsDevnet, connection }) }
})
jest.mock('../../../utils/accountUtils', () => ({
  solAddressIsValid: () => true,
}))
jest.mock(
  '@storage/AccountStorageProvider',
  () => {
    const accountStorage = { currentAccount: { solanaAddress: 'wallet' } }
    return { useAccountStorage: () => accountStorage }
  },
  { virtual: true },
)
jest.mock(
  '@storage/TokensProvider',
  () => {
    const tokens = { visibleTokens: new Set<string>() }
    return { useVisibleTokens: () => tokens }
  },
  { virtual: true },
)
jest.mock('@storage/cloudStorage', () => ({}), { virtual: true })
jest.mock('@helium/helium-react-hooks', () => {
  const owned = { amount: undefined }
  // One stable account per mint, with 6 decimals.
  const mints = new Map<string, unknown>()
  const mint = (address: { toBase58: () => string }) => {
    const key = address.toBase58()
    if (!mints.has(key)) mints.set(key, { info: { address, decimals: 6 } })
    return mints.get(key)
  }
  return {
    useMint: (address: { toBase58: () => string }) =>
      mockMintsLoaded ? mint(address) : undefined,
    useOwnedAmount: () => owned,
    useSolOwnedAmount: () => ({ amount: mockSolAmount }),
  }
})
jest.mock('@helium/spl-utils', () => {
  const { PublicKey } = jest.requireActual('@solana/web3.js')
  return {
    DC_MINT: new PublicKey('dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm'),
    HNT_MINT: new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'),
    IOT_MINT: new PublicKey('iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns'),
    MOBILE_MINT: new PublicKey('mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6'),
    toBN: (amount: number, decimals: number) =>
      new (jest.requireActual('bn.js'))(Math.round(amount * 10 ** decimals)),
    toNumber: (amount: BN, decimals: number) =>
      amount.toNumber() / 10 ** decimals,
    truthy: Boolean,
  }
})
jest.mock('@solana/spl-token', () => {
  const { PublicKey } = jest.requireActual('@solana/web3.js')
  return {
    NATIVE_MINT: new PublicKey('So11111111111111111111111111111111111111112'),
  }
})
jest.mock(
  '@hooks/useBN',
  () => ({
    useBN: (amount?: bigint) =>
      amount === undefined
        ? undefined
        : new (jest.requireActual('bn.js'))(amount.toString()),
  }),
  { virtual: true },
)
jest.mock('@hooks/useCurrentWallet', () => ({ useCurrentWallet: () => null }), {
  virtual: true,
})
jest.mock(
  '@hooks/useSubmitTxn',
  () => {
    const submit = {}
    return { __esModule: true, default: () => submit }
  },
  { virtual: true },
)
jest.mock(
  '@hooks/useTreasuryPrice',
  () => {
    const price = { price: undefined, loading: false }
    return { useTreasuryPrice: () => price }
  },
  { virtual: true },
)
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => {
    const metadata = { symbol: 'MOBILE' }
    return { useMetaplexMetadata: () => metadata }
  },
  { virtual: true },
)
jest.mock(
  '@utils/Balance',
  () => {
    const balance = {
      networkTokensToDc: () => undefined,
      dcToNetworkTokens: () => undefined,
      oraclePrice: undefined,
      oraclePriceError: undefined,
    }
    return { useBalance: () => balance }
  },
  { virtual: true },
)
jest.mock('@utils/constants', () => ({ MIN_BALANCE_THRESHOLD: 0 }), {
  virtual: true,
})
jest.mock(
  '@utils/solanaUtils',
  () => ({ TXN_FEE_IN_LAMPORTS: 5000, humanReadable: () => '0.000005' }),
  { virtual: true },
)
jest.mock('@theme/motion', () => ({ FADE_IN: {} }), { virtual: true })

// The shared composites render their children, as the real sheets do while
// closed.
const passThrough = ({ children }: { children?: React.ReactNode }) => children
jest.mock(
  '@ui/AddressBookSelector',
  () => ({ AddressBookSelector: passThrough }),
  { virtual: true },
)
jest.mock('@ui/HNTKeyboard', () => ({ HNTKeyboard: passThrough }), {
  virtual: true,
})
jest.mock('@ui/TokenSelector', () => ({ TokenSelector: passThrough }), {
  virtual: true,
})
jest.mock('@ui/CloseButton', () => ({ CloseButton: 'CloseButton' }), {
  virtual: true,
})
jest.mock('@ui/TextTransform', () => ({ TextTransform: 'TextTransform' }), {
  virtual: true,
})
jest.mock('@ui/TokenPill', () => ({ TokenPill: 'TokenPill' }), {
  virtual: true,
})

jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Card', () => ({ Card: 'Card' }), { virtual: true })
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('@ui/twMerge', () => jest.requireActual('../../../ui/twMerge'), {
  virtual: true,
})

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Keyboard: { dismiss: () => {} },
  LayoutAnimation: { configureNext: () => {}, Presets: {} },
}))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  Menu: 'Menu',
  Plus: 'Plus',
  RefreshCw: 'RefreshCw',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = async () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(<SwapNavigator />)
  })
  if (!renderer) throw new Error('render failed')
  const { root } = renderer
  const byTestID = (testID: string) =>
    root.findAll((n) => typeof n.type === 'string' && n.props.testID === testID)
  return {
    root,
    byTestID,
    texts: () =>
      root.findAllByType('Text' as never).map((n) => n.props.children),
  }
}

describe('SwapNavigator', () => {
  // SwapScreen reads the Jupiter quote context; the navigator supplies it.
  it('renders the swap screen with the pay item and a disabled submit', async () => {
    const view = await render()

    expect(view.byTestID('Swap.PayItem')).toHaveLength(1)
    const [submit] = view.byTestID('Swap.Submit')
    expect(submit.type).toBe('Button')
    // Nothing to pay yet, so the swap cannot be submitted.
    expect(submit.props.disabled).toBe(true)
  })

  it('opens and closes the slippage explainer', async () => {
    const view = await render()
    expect(view.texts()).not.toContain('swapsScreen.slippageInfo')

    const [slippageLabel] = view.root.findAll(
      (n) =>
        n.type === ('PressableScale' as never) &&
        n
          .findAllByType('Text' as never)
          .some((t) => t.props.children === 'swapsScreen.slippage'),
    )
    await act(async () => {
      slippageLabel.props.onPress()
    })
    expect(view.texts()).toContain('swapsScreen.slippageInfo')

    const closeButtons = view.root.findAllByType('CloseButton' as never)
    await act(async () => {
      closeButtons[closeButtons.length - 1].props.onPress()
    })
    expect(view.texts()).not.toContain('swapsScreen.slippageInfo')
  })

  it('marks only the current slippage option as selected', async () => {
    const view = await render()

    const options = view.root.findAll(
      (n) =>
        n.type === ('PressableScale' as never) &&
        n.props.accessibilityState !== undefined,
    )
    const selected = (label: string) =>
      options.find((n) =>
        n
          .findAllByType('Text' as never)
          .some((t) => [t.props.children].flat().join('') === label),
      )?.props.accessibilityState.selected

    // The screen opens at 50 bps.
    expect(selected('0.5%')).toBe(true)
    expect(selected('0.3%')).toBe(false)
  })

  it('keeps the recipient address as typed, without auto-capitalising it', async () => {
    const view = await render()

    // Pick DC as the token to receive, which offers a recipient.
    const [, receivePill] = view.root.findAllByType('TokenPill' as never)
    await act(async () => {
      receivePill.props.onPress()
    })
    const [tokenSelector] = view.root.findAll(
      (n) => typeof n.props.onTokenSelected === 'function',
    )
    const { DC_MINT } = jest.requireMock('@helium/spl-utils')
    await act(async () => {
      tokenSelector.props.onTokenSelected(DC_MINT)
    })

    const [addRecipient] = view.root.findAll(
      (n) =>
        n.type === ('PressableScale' as never) &&
        n
          .findAllByType('Text' as never)
          .some((t) => t.props.children === 'swapsScreen.addRecipient'),
    )
    await act(async () => {
      addRecipient.props.onPress()
    })

    const [recipientInput] = view.root.findAllByType('Input' as never)
    expect(recipientInput.props.autoCapitalize).toBe('none')
  })

  it('selects the slippage option that is pressed', async () => {
    const view = await render()

    const slippageOptions = () =>
      view.root.findAll(
        (n) =>
          n.type === ('PressableScale' as never) &&
          n.props.accessibilityState !== undefined,
      )
    const option = (label: string) =>
      slippageOptions().find((n) =>
        n
          .findAllByType('Text' as never)
          .some((t) => [t.props.children].flat().join('') === label),
      )

    await act(async () => {
      option('1%')?.props.onPress()
    })

    expect(option('1%')?.props.accessibilityState.selected).toBe(true)
    expect(option('0.5%')?.props.accessibilityState.selected).toBe(false)
  })

  it('disables the slippage options and selects none when receiving DC', async () => {
    const view = await render()

    const [, receivePill] = view.root.findAllByType('TokenPill' as never)
    await act(async () => {
      receivePill.props.onPress()
    })
    const [tokenSelector] = view.root.findAll(
      (n) => typeof n.props.onTokenSelected === 'function',
    )
    const { DC_MINT } = jest.requireMock('@helium/spl-utils')
    await act(async () => {
      tokenSelector.props.onTokenSelected(DC_MINT)
    })

    const options = view.root.findAll(
      (n) =>
        n.type === ('PressableScale' as never) &&
        n.props.accessibilityState !== undefined,
    )
    expect(options).toHaveLength(3)
    options.forEach((n) => {
      expect(n.props.accessibilityState.selected).toBe(false)
      expect(n.props.accessibilityState.disabled).toBe(true)
    })
  })

  it('labels the refresh control for screen readers', async () => {
    const view = await render()

    const refresh = view.root.findAll(
      (n) =>
        n.type === ('PressableScale' as never) &&
        n.props.accessibilityLabel === 'swapsScreen.refresh',
    )
    expect(refresh).toHaveLength(1)
  })

  it('labels the address book control for screen readers', async () => {
    const view = await render()

    const [, receivePill] = view.root.findAllByType('TokenPill' as never)
    await act(async () => {
      receivePill.props.onPress()
    })
    const [tokenSelector] = view.root.findAll(
      (n) => typeof n.props.onTokenSelected === 'function',
    )
    const { DC_MINT } = jest.requireMock('@helium/spl-utils')
    await act(async () => {
      tokenSelector.props.onTokenSelected(DC_MINT)
    })
    const [addRecipient] = view.root.findAll(
      (n) =>
        n.type === ('PressableScale' as never) &&
        n
          .findAllByType('Text' as never)
          .some((t) => t.props.children === 'swapsScreen.addRecipient'),
    )
    await act(async () => {
      addRecipient.props.onPress()
    })

    const addressBook = view.root.findAll(
      (n) =>
        n.type === ('PressableScale' as never) &&
        n.props.accessibilityLabel === 'swapsScreen.openAddressBook',
    )
    expect(addressBook).toHaveLength(1)
  })

  // The ATA fee feeds the insufficient-SOL check, so a swap before it loads
  // skips that check. Devnet prices the swap without a Jupiter route.
  it.each([
    [true, true],
    [false, false],
  ])(
    'with the ATA fee loading %s, disables the submit: %s',
    async (isLoading, disabled) => {
      mockIsDevnet = true
      mockMintsLoaded = true
      mockAtaFeeQuery = {
        data: isLoading ? undefined : new BN(2_039_280),
        isLoading,
      }
      mockSolAmount = BigInt(1_000_000_000)
      const view = await render()

      const keyboard = view.root.find(
        (n) => typeof n.props.onConfirmBalance === 'function',
      )
      await act(async () => {
        keyboard.props.onConfirmBalance({ balance: new BN(1_000_000) })
      })

      const [submit] = view.byTestID('Swap.Submit')
      expect(submit.props.disabled).toBe(disabled)
    },
  )

  // With no SOL balance there is no fee check, so the swap cannot go out.
  it('disables the submit when the ATA fee loaded but the SOL balance has not', async () => {
    mockIsDevnet = true
    mockMintsLoaded = true
    mockAtaFeeQuery = { data: new BN(2_039_280), isLoading: false }
    const view = await render()

    const keyboard = view.root.find(
      (n) => typeof n.props.onConfirmBalance === 'function',
    )
    await act(async () => {
      keyboard.props.onConfirmBalance({ balance: new BN(1_000_000) })
    })

    const [submit] = view.byTestID('Swap.Submit')
    expect(submit.props.disabled).toBe(true)
  })

  it('switches the amount keyboard back to the paid token when the pay item is pressed', async () => {
    const view = await render()
    const keyboard = () =>
      view.root.find((n) => typeof n.props.onConfirmBalance === 'function')

    // Choosing the token to receive points the keyboard at the received side.
    const [, receivePill] = view.root.findAllByType('TokenPill' as never)
    await act(async () => {
      receivePill.props.onPress()
    })
    expect(keyboard().props.allowOverdraft).toBe(true)

    const [payItem] = view.byTestID('Swap.PayItem')
    await act(async () => {
      payItem.props.onPress()
    })

    expect(keyboard().props.allowOverdraft).toBe(false)
  })
})
