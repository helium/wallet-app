import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import TransferCollectableScreen from '../TransferCollectableScreen'

// Each test sets what the transfer fee query returns: the fee and the SOL
// balance in lamports, or the error the RPC gave.
let mockFeeQuery: {
  data?: { feeLamports: number; balanceLamports: number } | null
  error: Error | null
}

jest.mock(
  '@ui/TabSafeAreaView',
  () => ({ TabSafeAreaView: 'TabSafeAreaView' }),
  {
    virtual: true,
  },
)
jest.mock('@ui/Image', () => ({ Image: 'Image' }), { virtual: true })
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => mockFeeQuery,
}))
jest.mock('../transferCollectableFeeQuery', () => ({
  transferCollectableFeeQuery: () => ({}),
}))
jest.mock('@react-navigation/native', () => {
  const navigation = { navigate: () => {}, push: () => {} }
  const route = {
    params: { collectable: { json: { name: 'NFT', image: 'nft.png' } } },
  }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('../../../hooks/useSubmitTxn', () => {
  const submit = { submitCollectable: () => Promise.resolve('batch') }
  return { __esModule: true, default: () => submit }
})
jest.mock('../../../solana/SolanaProvider', () => {
  const solana = { anchorProvider: {} }
  return { useSolana: () => solana }
})
jest.mock('../../../storage/AccountStorageProvider', () => {
  const storage = { currentAccount: { solanaAddress: 'wallet', address: 'a' } }
  return { useAccountStorage: () => storage }
})
jest.mock('../../../storage/cloudStorage', () => ({}))
jest.mock('../../../utils/accountUtils', () => ({
  solAddressIsValid: (address: string) => address.length > 0,
}))
jest.mock('../../../utils/layout', () => ({ useContentWidth: () => 400 }))
jest.mock('../../../utils/logger', () => ({ error: () => {} }))
jest.mock('../components/BackHeader', () => 'BackHeader')
jest.mock('text-encoding-polyfill', () => ({}))

const passThrough = ({ children }: { children?: React.ReactNode }) => children
jest.mock(
  '@ui/AddressBookSelector',
  () => {
    const ReactActual = jest.requireActual('react')
    return {
      AddressBookSelector: ReactActual.forwardRef(
        ({ children }: { children?: React.ReactNode }, _ref: unknown) =>
          children,
      ),
    }
  },
  { virtual: true },
)
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
jest.mock('@ui/twMerge', () => ({ twMerge: () => '' }), { virtual: true })
jest.mock('expo-blur', () => ({ BlurView: 'BlurView' }))
jest.mock('lucide-react-native', () => ({
  ChevronRight: 'ChevronRight',
  Info: 'Info',
  Menu: 'Menu',
}))
jest.mock('react-i18next', () => ({
  Trans: 'Trans',
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  Image: 'Image',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  LogBox: { ignoreLogs: () => {} },
  Platform: { OS: 'ios' },
  ScrollView: 'ScrollView',
  View: 'View',
}))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: passThrough,
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// Renders the screen and types a valid recipient, so only the fee and the
// balance can hold the Transfer button.
const renderWithRecipient = () => {
  let renderer!: TestRenderer.ReactTestRenderer
  act(() => {
    renderer = TestRenderer.create(<TransferCollectableScreen />)
  })
  const { root } = renderer
  act(() => {
    root.findByType('Input' as never).props.onChangeText('recipient')
  })
  return root.findByType('Button' as never)
}

describe('TransferCollectableScreen', () => {
  it('enables Transfer when the balance covers the fee', () => {
    mockFeeQuery = {
      data: { feeLamports: 5000, balanceLamports: 10000 },
      error: null,
    }

    expect(renderWithRecipient().props.disabled).toBe(false)
  })

  it('disables Transfer when the balance does not cover the fee', () => {
    mockFeeQuery = {
      data: { feeLamports: 5000, balanceLamports: 4999 },
      error: null,
    }

    expect(renderWithRecipient().props.disabled).toBe(true)
  })

  it('disables Transfer when the fee could not be read', () => {
    mockFeeQuery = { data: undefined, error: new Error('rpc down') }

    expect(renderWithRecipient().props.disabled).toBe(true)
  })

  it('disables Transfer while the fee loads', () => {
    mockFeeQuery = { data: undefined, error: null }

    expect(renderWithRecipient().props.disabled).toBe(true)
  })
})
