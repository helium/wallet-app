import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AddGatewayBle from '../iot-ble/AddGatewayBle'

// The onboard run starts by loading the entity manager program. Each test
// settles that load when it chooses, so a run stays in flight until then.
const mockInit = jest.fn<Promise<never>, [unknown]>()

jest.mock('@helium/helium-entity-manager-sdk', () => ({
  init: (provider: unknown) => mockInit(provider),
  iotInfoKey: () => [{}],
  mobileInfoKey: () => [{}],
  keyToAssetKey: () => [{ toBase58: () => 'keyToAsset' }],
}))
jest.mock('@helium/helium-sub-daos-sdk', () => ({ daoKey: () => [{}] }))
jest.mock('@helium/react-native-sdk', () => {
  const onboarding = {
    onboardingClient: { createHotspot: () => Promise.resolve({}) },
    getOnboardTransactions: () => Promise.resolve({}),
  }
  return { useOnboarding: () => onboarding }
})
jest.mock('@helium/spl-utils', () => {
  const { PublicKey } = jest.requireActual('@solana/web3.js')
  return {
    HNT_MINT: new PublicKey('hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux'),
    IOT_MINT: new PublicKey('iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns'),
    MOBILE_MINT: new PublicKey('mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6'),
    getAsset: () => Promise.resolve(undefined),
    truthy: Boolean,
  }
})
jest.mock(
  '@hooks/useCurrentWallet',
  () => {
    const { PublicKey } = jest.requireActual('@solana/web3.js')
    const wallet = new PublicKey('11111111111111111111111111111112')
    return { useCurrentWallet: () => wallet }
  },
  { virtual: true },
)
jest.mock(
  '@hooks/useImplicitBurn',
  () => ({
    useImplicitBurn: () => ({ implicitBurn: () => Promise.resolve() }),
  }),
  { virtual: true },
)
jest.mock('@hooks/useKeyToAsset', () => ({ useKeyToAsset: () => ({}) }), {
  virtual: true,
})
// The maker holds enough SOL and DC, so the screen offers the plain Onboard
// button.
jest.mock(
  '@hooks/useOnboardingBalances',
  () => {
    const BNActual = jest.requireActual('bn.js')
    const balances = {
      error: undefined,
      maker: { address: 'maker', name: 'Maker' },
      loadingMaker: false,
      mySol: new BNActual(1_000_000_000),
      makerDc: new BNActual(1_000_000),
      loadingMakerSol: false,
      loadingMySol: false,
      myDc: new BNActual(1_000_000),
      myDcWithHnt: undefined,
      loadingMyDcWithHnt: false,
      loadingMyDc: false,
      makerSol: new BNActual(1_000_000_000),
      loadingMakerDc: false,
      onboardingDcRequirements: {},
      locationAssertDcRequirements: {},
      loadingOnboardingDcRequirements: false,
    }
    return { useOnboardingBalnces: () => balances }
  },
  { virtual: true },
)
jest.mock(
  '@hooks/useSubmitAndAwait',
  () => ({ useSubmitAndAwait: () => ({ submitAndAwait: () => {} }) }),
  { virtual: true },
)
jest.mock('@react-navigation/native', () => {
  const navigation = { navigate: () => {} }
  const route = {
    params: {
      createGatewayTx: undefined,
      onboardingAddress: 'hotspot',
      network: 'IOT',
    },
  }
  return { useNavigation: () => navigation, useRoute: () => route }
})
jest.mock(
  '@storage/AccountStorageProvider',
  () => {
    const storage = { currentAccount: { address: 'owner' } }
    return { useAccountStorage: () => storage }
  },
  { virtual: true },
)
jest.mock(
  '@utils/constants',
  () => ({ IOT_CONFIG_KEY: {}, MOBILE_CONFIG_KEY: {} }),
  { virtual: true },
)
jest.mock('@utils/dcWithHnt', () => ({ waitingOnHntPrice: () => false }), {
  virtual: true,
})
jest.mock('@utils/sleep', () => () => Promise.resolve(), { virtual: true })
jest.mock(
  '@utils/solanaUtils',
  () => ({
    calculateRequiredSol: () => Promise.resolve(undefined),
    getHotspotWithRewards: () => Promise.resolve(undefined),
  }),
  { virtual: true },
)
jest.mock(
  '@utils/transactionUtils',
  () => ({ toTransactionData: () => ({}), hashTagParams: () => 'hash' }),
  { virtual: true },
)
// The asset and required-SOL reads stay unloaded; the mutation is real.
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: () => ({ data: undefined, isLoading: false }),
}))
jest.mock('../../../solana/SolanaProvider', () => {
  const solana = {
    anchorProvider: {
      connection: { rpcEndpoint: 'rpc' },
      wallet: { publicKey: { toBase58: () => 'owner' } },
    },
  }
  return { useSolana: () => solana }
})
jest.mock(
  '../components/OnboardingScreen',
  () =>
    ({ children }: { children?: React.ReactNode }) =>
      children,
)

jest.mock('@ui/Button', () => ({ Button: 'Button' }), { virtual: true })
jest.mock('@ui/buttonVariants', () => ({ buttonTextVariants: () => '' }), {
  virtual: true,
})
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/RadioButton', () => ({ RadioButton: 'RadioButton' }), {
  virtual: true,
})
jest.mock('@ui/Spinner', () => ({ Spinner: 'Spinner' }), { virtual: true })
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
jest.mock('react-native', () => ({
  Alert: { alert: () => {} },
  Linking: {},
  ScrollView: 'ScrollView',
  View: 'View',
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

const render = async () => {
  const queryClient = new QueryClient()
  let renderer!: TestRenderer.ReactTestRenderer
  await act(async () => {
    renderer = TestRenderer.create(
      <QueryClientProvider client={queryClient}>
        <AddGatewayBle />
      </QueryClientProvider>,
    )
  })
  const onboardButton = () => renderer.root.findByType('Button' as never)
  return { renderer, onboardButton }
}

describe('AddGatewayBle', () => {
  beforeEach(() => {
    mockInit.mockReset()
  })

  it('starts one onboard run for two presses in one tick', async () => {
    let failLoad!: (error: Error) => void
    mockInit.mockReturnValueOnce(
      new Promise<never>((_resolve, reject) => {
        failLoad = reject
      }),
    )
    const { renderer, onboardButton } = await render()

    await act(async () => {
      onboardButton().props.onPress()
      onboardButton().props.onPress()
    })
    expect(mockInit).toHaveBeenCalledTimes(1)

    // Once the first run settles, a press starts a new run.
    await act(async () => {
      failLoad(new Error('load failed'))
    })
    mockInit.mockReturnValueOnce(new Promise<never>(() => {}))
    await act(async () => {
      onboardButton().props.onPress()
    })
    expect(mockInit).toHaveBeenCalledTimes(2)

    act(() => {
      renderer.unmount()
    })
  })
})
