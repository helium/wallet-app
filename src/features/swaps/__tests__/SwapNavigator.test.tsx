import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import SwapNavigator from '../SwapNavigator'

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
jest.mock('@tanstack/react-query', () => {
  const query = { data: undefined }
  return { useQuery: () => query }
})
jest.mock('@react-navigation/native', () => {
  const navigation = { goBack: () => {}, push: () => {} }
  return { useNavigation: () => navigation }
})

// Stable hook values: the screen's effects depend on them.
jest.mock('../../../solana/SolanaProvider', () => {
  const solana = { isDevnet: false, connection: {} }
  return { useSolana: () => solana }
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
  return {
    useMint: () => undefined,
    useOwnedAmount: () => owned,
    useSolOwnedAmount: () => owned,
  }
})
jest.mock('@helium/spl-utils', () => {
  const { PublicKey } = jest.requireActual('@solana/web3.js')
  return {
    DC_MINT: new PublicKey('dcuc8Amr83Wz27ZkQ2K9NS6r8zRpf1J6cvArEBDZDmm'),
    HNT_MINT: new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'),
    IOT_MINT: new PublicKey('iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns'),
    MOBILE_MINT: new PublicKey('mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6'),
    toBN: () => undefined,
    toNumber: () => 0,
    truthy: Boolean,
  }
})
jest.mock('@solana/spl-token', () => {
  const { PublicKey } = jest.requireActual('@solana/web3.js')
  return {
    NATIVE_MINT: new PublicKey('So11111111111111111111111111111111111111112'),
  }
})
jest.mock('@hooks/useBN', () => ({ useBN: () => undefined }), {
  virtual: true,
})
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
  '@components/AddressBookSelector',
  () => ({ __esModule: true, default: passThrough }),
  { virtual: true },
)
jest.mock(
  '@components/HNTKeyboard',
  () => ({ __esModule: true, default: passThrough }),
  { virtual: true },
)
jest.mock(
  '@components/TokenSelector',
  () => ({ __esModule: true, default: passThrough }),
  { virtual: true },
)
jest.mock(
  '@components/CloseButton',
  () => ({ __esModule: true, default: 'CloseButton' }),
  { virtual: true },
)
jest.mock(
  '@components/TextTransform',
  () => ({ __esModule: true, default: 'TextTransform' }),
  { virtual: true },
)
jest.mock(
  '@components/TokenPill',
  () => ({ __esModule: true, default: 'TokenPill' }),
  { virtual: true },
)

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
jest.mock(
  '@ui/buttonVariants',
  () => jest.requireActual('../../../ui/buttonVariants'),
  { virtual: true },
)

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Keyboard: { dismiss: () => {} },
  LayoutAnimation: { configureNext: () => {}, Presets: {} },
  Platform: { OS: 'ios' },
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
})
