import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import RootNavigator from '../RootNavigator'

const mockNavigate = jest.fn()
const mockSetOnboardingData = jest.fn()
const mockHide = jest.fn()
const mockToastShow = jest.fn()

jest.mock('@react-navigation/native', () => {
  const navigation = {
    navigate: (...args: unknown[]) => mockNavigate(...args),
  }
  return { useNavigation: () => navigation }
})
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: 'Navigator',
    Screen: 'Screen',
  }),
}))
jest.mock(
  '@hooks/useDerivationAccounts',
  () => {
    const { Keypair } = jest.requireActual('@solana/web3.js')
    return {
      HELIUM_DERIVATION: 'helium-path',
      solanaDerivation: (account: number, change: number) =>
        `m/44'/501'/${account}'/${change}'`,
      keypairFromSeed: async () => Keypair.fromSeed(new Uint8Array(32).fill(3)),
    }
  },
  { virtual: true },
)
jest.mock(
  '@storage/AccountStorageProvider',
  () => {
    const storage = {
      currentAccount: { address: 'current' },
      accounts: {},
    }
    return { useAccountStorage: () => storage }
  },
  { virtual: true },
)
jest.mock(
  '@storage/secureStorage',
  () => ({
    getSecureAccount: async () => ({ mnemonic: ['seed', 'words'] }),
  }),
  { virtual: true },
)
jest.mock('@storage/cloudStorage', () => ({}), { virtual: true })
jest.mock('bip39', () => ({ mnemonicToSeedSync: () => Buffer.alloc(64) }))
jest.mock('react-native-navigation-bar-color', () => () => {})
jest.mock('react-native-simple-toast', () => ({
  show: (...args: unknown[]) => mockToastShow(...args),
  SHORT: 0,
}))
jest.mock('uniwind', () => ({ useCSSVariable: () => '#000000' }))
jest.mock('../../ui/ContentColumn', () => ({ contentColumnLayout: undefined }))
jest.mock('../../features/account/ConnectedWallets', () => {
  const ReactActual = jest.requireActual('react')
  const ConnectedWallets = ReactActual.forwardRef(
    (props: { children?: React.ReactNode }, ref: React.Ref<unknown>) => {
      ReactActual.useImperativeHandle(ref, () => ({
        show: () => {},
        hide: () => mockHide(),
      }))
      return ReactActual.createElement('ConnectedWallets', props)
    },
  )
  return { __esModule: true, default: ConnectedWallets }
})
jest.mock('../../features/dappLogin/DappLoginScreen', () => 'DappLoginScreen')
jest.mock(
  '../../features/onboarding/OnboardingNavigator',
  () => 'OnboardingNavigator',
)
jest.mock('../../features/onboarding/OnboardingProvider', () => {
  const onboarding = {
    onboardingData: {},
    setOnboardingData: (...args: unknown[]) => mockSetOnboardingData(...args),
  }
  return { useOnboarding: () => onboarding }
})
jest.mock(
  '../../features/onboarding/import/ImportPrivateKey',
  () => 'ImportPrivateKey',
)
jest.mock('../../features/payment/PaymentScreen', () => 'PaymentScreen')
jest.mock('../../features/txnDelegation/LinkWallet', () => 'LinkWallet')
jest.mock('../../features/txnDelegation/SignHotspot', () => 'SignHotspot')
jest.mock('../../store/appStore', () => {
  const state = {
    showConnectedWallets: false,
    toggleConnectedWallets: () => {},
  }
  return {
    useAppStore: (select: (s: typeof state) => unknown) => select(state),
  }
})
jest.mock('../TabBarNavigator', () => 'TabBarNavigator')

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = async () => {
  let renderer!: TestRenderer.ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(
      <QueryClientProvider client={new QueryClient()}>
        <RootNavigator />
      </QueryClientProvider>,
    )
  })
  return renderer.root.findByType('ConnectedWallets' as never)
}

beforeEach(() => {
  mockNavigate.mockReset()
  mockSetOnboardingData.mockReset()
  mockHide.mockReset()
  mockToastShow.mockReset()
})

describe('RootNavigator', () => {
  it('pops back to the add account flow when the wallet list adds a new account', async () => {
    const wallets = await render()

    act(() => {
      wallets.props.onAddNew()
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      'TabBarNavigator',
      { screen: 'Home', params: { screen: 'AddNewAccountNavigator' } },
      { pop: true },
    )
  })

  it('pops back to the assign step with the next sub account of the seed', async () => {
    const wallets = await render()

    await act(async () => {
      wallets.props.onAddSub({
        address: 'current',
        derivationPath: 'helium-path',
      })
    })

    expect(mockToastShow).not.toHaveBeenCalled()
    expect(mockSetOnboardingData).toHaveBeenCalledWith(
      expect.objectContaining({
        words: ['seed', 'words'],
        paths: [
          expect.objectContaining({ derivationPath: "m/44'/501'/0'/0'" }),
        ],
      }),
    )
    expect(mockNavigate).toHaveBeenCalledWith(
      'TabBarNavigator',
      {
        screen: 'Home',
        params: {
          screen: 'AccountAssignScreen',
          params: { words: ['seed', 'words'] },
        },
      },
      { pop: true },
    )
    expect(mockHide).toHaveBeenCalledTimes(1)
  })
})
