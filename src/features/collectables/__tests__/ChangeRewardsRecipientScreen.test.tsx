import React from 'react'
import { PublicKey } from '@solana/web3.js'
import TestRenderer, { act } from 'react-test-renderer'
import ChangeRewardsRecipientScreen from '../ChangeRewardsRecipientScreen'

const OTHER = new PublicKey('SysvarRent111111111111111111111111111111111')

// Resolved by each test, so a submit stays in flight until the test ends it.
let mockFinishSubmit: ((error?: Error) => void) | undefined
const mockSubmitUpdateRewardsDestination = jest.fn(
  () =>
    new Promise<void>((resolve, reject) => {
      mockFinishSubmit = (error) => (error ? reject(error) : resolve())
    }),
)

jest.mock(
  '@hooks/useSubmitTxn',
  () => () => ({
    submitUpdateRewardsDestination: mockSubmitUpdateRewardsDestination,
  }),
  { virtual: true },
)
jest.mock(
  '@hooks/useCurrentWallet',
  () => {
    const { PublicKey: Key } = jest.requireActual('@solana/web3.js')
    const wallet = new Key('11111111111111111111111111111112')
    return { useCurrentWallet: () => wallet }
  },
  { virtual: true },
)
jest.mock('@hooks/useEntityKey', () => ({ useEntityKey: () => 'entity' }), {
  virtual: true,
})
jest.mock('@hooks/useIotInfo', () => ({ useIotInfo: () => ({}) }), {
  virtual: true,
})
jest.mock('@hooks/useMobileInfo', () => ({ useMobileInfo: () => ({}) }), {
  virtual: true,
})
jest.mock('@assets/images/hnt.svg', () => 'HntSymbol', { virtual: true })
jest.mock('@assets/images/iotSymbol.svg', () => 'IotSymbol', {
  virtual: true,
})
jest.mock('@assets/images/mobileSymbol.svg', () => 'MobileSymbol', {
  virtual: true,
})
jest.mock('@storage/cloudStorage', () => ({}), { virtual: true })
jest.mock(
  '@utils/accountUtils',
  () => ({
    ellipsizeAddress: (address: string) => address,
    solAddressIsValid: () => true,
  }),
  { virtual: true },
)
jest.mock(
  '@utils/constants',
  () => ({ HNT_LAZY_KEY: 'hnt', IOT_LAZY_KEY: 'iot', MOBILE_LAZY_KEY: 'mob' }),
  { virtual: true },
)
jest.mock('../../../utils/constants', () => ({
  Mints: { HNT: 'hnt-mint', IOT: 'iot-mint', MOBILE: 'mobile-mint' },
}))
jest.mock('../../../utils/logger', () => ({ error: () => {} }))
jest.mock('@react-navigation/native', () => {
  const { PublicKey: Key } = jest.requireActual('@solana/web3.js')
  const other = new Key('SysvarRent111111111111111111111111111111111')
  const navigation = { goBack: jest.fn() }
  const route = {
    params: {
      hotspot: {
        id: 'asset',
        rewardRecipients: {
          'hnt-mint': { destination: other },
          'iot-mint': { destination: other },
          'mobile-mint': { destination: other },
        },
      },
    },
  }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock('../../addressBook/AddressBookSelector', () => {
  const ReactActual = jest.requireActual('react')
  return {
    __esModule: true,
    default: ReactActual.forwardRef(
      ({ children }: { children: React.ReactNode }, _ref: unknown) => children,
    ),
  }
})
jest.mock('../components/BackHeader', () => 'BackHeader')
jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/Input', () => ({ Input: 'Input' }), { virtual: true })
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('lucide-react-native', () => ({ Menu: 'Menu' }))
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  Keyboard: { dismiss: () => {} },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  View: 'View',
}))
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'Animated.View' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = () => {
  let created: TestRenderer.ReactTestRenderer | undefined
  act(() => {
    created = TestRenderer.create(<ChangeRewardsRecipientScreen />)
  })
  if (!created) throw new Error('render failed')
  const { root } = created
  return {
    // The row's remove control is the only PressableScale given `disabled`.
    remove: () =>
      root
        .findAllByType('PressableScale' as never)
        .find((node) => 'disabled' in node.props),
    submit: () => root.findByType('Button' as never),
    input: () => root.findByType('Input' as never),
  }
}

beforeEach(() => {
  mockSubmitUpdateRewardsDestination.mockClear()
  mockFinishSubmit = undefined
})

describe('ChangeRewardsRecipientScreen', () => {
  it('shows a remove control for a recipient other than the wallet', () => {
    const view = render()
    expect(view.remove()?.props.disabled).toBe(false)
  })

  // A second press while the removal is in flight would send a second
  // transaction.
  it('disables remove while a removal is in flight', async () => {
    const view = render()

    act(() => {
      view.remove()?.props.onPress()
    })
    expect(mockSubmitUpdateRewardsDestination).toHaveBeenCalledTimes(1)
    expect(view.remove()?.props.disabled).toBe(true)

    await act(async () => {
      mockFinishSubmit?.(new Error('rejected'))
    })
    expect(view.remove()?.props.disabled).toBe(false)
  })

  // A removal sent while an update is in flight races it on chain.
  it('disables remove while an update is in flight', async () => {
    const view = render()

    act(() => {
      view.input().props.onChangeText(OTHER.toBase58())
    })
    act(() => {
      view.submit().props.onPress()
    })
    expect(mockSubmitUpdateRewardsDestination).toHaveBeenCalledTimes(1)
    expect(view.remove()?.props.disabled).toBe(true)

    await act(async () => {
      mockFinishSubmit?.(new Error('rejected'))
    })
    expect(view.remove()?.props.disabled).toBe(false)
  })

  it('does not capitalise a typed recipient address', () => {
    const view = render()
    expect(view.input().props.autoCapitalize).toBe('none')
  })
})
