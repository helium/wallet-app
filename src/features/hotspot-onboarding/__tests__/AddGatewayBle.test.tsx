import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import AddGatewayBle from '../iot-ble/AddGatewayBle'

// The onboard run starts by loading the entity manager program. Each test
// settles that load when it chooses, so a run stays in flight until then.
const mockInit = jest.fn<Promise<unknown>, [unknown]>()
const mockGetOnboardTransactions = jest.fn()
const mockImplicitBurn = jest.fn()
const mockSubmitAndAwait = jest.fn()
const mockNavigate = jest.fn()
// When set, the maker is short on SOL, so the owner can pay the onboard fee.
let mockMakerShortOnSol = false

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
    getOnboardTransactions: (...args: unknown[]) =>
      mockGetOnboardTransactions(...args),
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
    useImplicitBurn: () => ({
      implicitBurn: (...args: unknown[]) => mockImplicitBurn(...args),
    }),
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
    const makerShortOnSol = {
      ...balances,
      makerSol: new BNActual(0),
      onboardingDcRequirements: {
        iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns: new BNActual(500),
      },
    }
    return {
      useOnboardingBalnces: () =>
        mockMakerShortOnSol ? makerShortOnSol : balances,
    }
  },
  { virtual: true },
)
jest.mock(
  '@hooks/useSubmitAndAwait',
  () => ({
    useSubmitAndAwait: () => ({
      submitAndAwait: (...args: unknown[]) => mockSubmitAndAwait(...args),
    }),
  }),
  { virtual: true },
)
jest.mock('@react-navigation/native', () => {
  const navigation = {
    navigate: (...args: unknown[]) => mockNavigate(...args),
  }
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
    getHotspotWithRewards: (asset: string) =>
      Promise.resolve({ id: `collectable-${asset}` }),
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
    mockGetOnboardTransactions.mockReset()
    mockGetOnboardTransactions.mockResolvedValue({
      solanaTransactions: ['AQ=='],
    })
    mockImplicitBurn.mockReset()
    mockImplicitBurn.mockResolvedValue(undefined)
    mockSubmitAndAwait.mockReset()
    mockSubmitAndAwait.mockResolvedValue(undefined)
    mockNavigate.mockReset()
    mockMakerShortOnSol = false
  })

  // The entity manager program as the onboard run reads it. The Hotspot's
  // asset shows up on the second key-to-asset read, after the onboard lands.
  const hemProgram = (networkInfo: unknown) => {
    const keyToAssetFetch = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ asset: 'asset' })
    return {
      account: {
        iotHotspotInfoV0: { fetchNullable: () => Promise.resolve(networkInfo) },
        keyToAssetV0: { fetchNullable: keyToAssetFetch },
      },
    }
  }

  it('onboards a new Hotspot, waits for its asset and pops to the location step', async () => {
    const program = hemProgram(null)
    mockInit.mockResolvedValue(program)
    const { onboardButton } = await render()

    await act(async () => {
      onboardButton().props.onPress()
    })

    expect(mockImplicitBurn).not.toHaveBeenCalled()
    expect(mockGetOnboardTransactions).toHaveBeenCalledWith({
      hotspotAddress: 'hotspot',
      payer: undefined,
      networkDetails: [{ hotspotType: 'IOT' }],
    })
    expect(mockSubmitAndAwait).toHaveBeenCalledTimes(1)
    expect(program.account.keyToAssetV0.fetchNullable).toHaveBeenCalledTimes(2)
    expect(mockNavigate).toHaveBeenCalledWith(
      'AssertLocationScreen',
      { collectable: { id: 'collectable-asset' } },
      { pop: true },
    )
  })

  it('skips the onboard of a Hotspot already on the network and pops to its map', async () => {
    mockInit.mockResolvedValue(hemProgram({ hotspot: 'info' }))
    const { onboardButton } = await render()

    await act(async () => {
      onboardButton().props.onPress()
    })

    expect(mockGetOnboardTransactions).not.toHaveBeenCalled()
    expect(mockSubmitAndAwait).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith(
      'HotspotMapScreen',
      { hotspot: { id: 'collectable-asset' }, network: 'IOT' },
      { pop: true },
    )
  })

  it('burns HNT to DC and onboards with the owner as payer when the owner pays', async () => {
    mockMakerShortOnSol = true
    mockInit.mockResolvedValue(hemProgram(null))
    const { renderer } = await render()

    // The second option is the owner paying the fee.
    const payOption = renderer.root.findAllByType('PressableScale' as never)[1]
    await act(async () => {
      payOption.props.onPress()
    })
    const payButton = renderer.root.findByProps({ variant: 'destructive' })
    await act(async () => {
      payButton.props.onPress()
    })

    expect(mockImplicitBurn).toHaveBeenCalledWith(500)
    expect(mockGetOnboardTransactions).toHaveBeenCalledWith({
      hotspotAddress: 'hotspot',
      payer: '11111111111111111111111111111112',
      networkDetails: [{ hotspotType: 'IOT' }],
    })
    expect(mockImplicitBurn.mock.invocationCallOrder[0]).toBeLessThan(
      mockGetOnboardTransactions.mock.invocationCallOrder[0],
    )
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
