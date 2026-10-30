import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import Banner from '../AutoGasBanner'

// The banner swaps a token for SOL when the SOL balance is low. A token
// balance change while the swap waits for submitAndAwait must not start a
// second swap, and the tag hash must use the amount of this swap.
declare const globalThis: { IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mockSwapAmount = 7.5
const mockMint = { toBase58: () => 'MINT' }
const mockAnchorProvider = {
  connection: { rpcEndpoint: 'http://rpc' },
  publicKey: { toBase58: () => 'WALLET' },
  wallet: { publicKey: { toBase58: () => 'WALLET' } },
}
let mockTokenBalance = 1000
const mockShow = jest.fn((_opts: unknown) => Promise.resolve(true))
const mockWalletSign = { walletSignBottomSheetRef: { show: mockShow } }
let resolveSubmit: () => void = () => {}
const mockSubmitAndAwait = jest.fn(
  (_opts: unknown) =>
    new Promise<void>((resolve) => {
      resolveSubmit = resolve
    }),
)
const mockSubmit = { submitAndAwait: mockSubmitAndAwait }
const mockHashTagParams = jest.fn((_params: unknown) => 'HASH')
const mockGet = jest.fn((_url: string) =>
  Promise.resolve({ data: { MINT: '100' } }),
)
const mockPost = jest.fn((_url: string, _body: unknown) =>
  Promise.resolve({ data: [1, 2, 3] }),
)
const mockT = (key: string) => key

jest.mock('@assets/images/closeCircleFilled.svg', () => 'CloseCircle', {
  virtual: true,
})
jest.mock('@assets/images/warning.svg', () => 'Warning', { virtual: true })
jest.mock('@helium/helium-react-hooks', () => ({
  useMint: () => ({ info: { decimals: 6 } }),
  useOwnedAmount: () => ({ amount: mockTokenBalance }),
  useSolOwnedAmount: () => ({ amount: 1 }),
}))
jest.mock('@helium/spl-utils', () => ({ toNumber: () => mockSwapAmount }))
jest.mock(
  '@hooks/useMetaplexMetadata',
  () => ({ useMetaplexMetadata: () => ({ symbol: 'HNT' }) }),
  { virtual: true },
)
jest.mock(
  '@hooks/useSubmitAndAwait',
  () => ({ useSubmitAndAwait: () => mockSubmit }),
  { virtual: true },
)
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getAccountInfo: () => Promise.resolve({ lamports: 1 }),
  })),
  VersionedTransaction: {
    deserialize: () => ({ serialize: () => new Uint8Array([1]) }),
  },
}))
jest.mock(
  '@storage/AppStorageProvider',
  () => ({ useAppStorage: () => ({ autoGasManagementToken: mockMint }) }),
  { virtual: true },
)
jest.mock('@utils/constants', () => ({ MIN_BALANCE_THRESHOLD: 10 }), {
  virtual: true,
})
jest.mock(
  '@utils/transactionUtils',
  () => ({
    hashTagParams: (params: unknown) => mockHashTagParams(params),
    toTransactionData: () => ({}),
  }),
  { virtual: true },
)
jest.mock(
  '@utils/config',
  () => ({
    TOKENS_TO_RENT_SERVICE_URL: 'http://rent',
    TOKENS_TO_RENT_SERVICE_DEVNET_URL: 'http://rent-devnet',
  }),
  { virtual: true },
)
jest.mock('axios', () => ({
  get: (url: string) => mockGet(url),
  post: (url: string, body: unknown) => mockPost(url, body),
}))
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }))
jest.mock('react-native-reanimated', () => ({
  useAnimatedStyle: () => ({}),
  withTiming: (v: number) => v,
}))
jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: null,
  useSafeAreaInsets: () => ({ top: 0 }),
}))
jest.mock('../../solana/SolanaProvider', () => ({
  useSolana: () => ({
    cluster: 'mainnet-beta',
    anchorProvider: mockAnchorProvider,
  }),
}))
jest.mock('../../solana/WalletSignProvider', () => ({
  useWalletSign: () => mockWalletSign,
}))
jest.mock('../../solana/walletSignBottomSheetTypes', () => ({
  WalletStandardMessageTypes: { signTransaction: 'signTransaction' },
}))
jest.mock('../../store/appStore', () => ({
  useAppStore: () => jest.fn(),
}))
jest.mock('../AnimatedBox', () => ({ ReAnimatedBox: 'ReAnimatedBox' }))
jest.mock('../Box', () => 'Box')
jest.mock('../CircleLoader', () => 'CircleLoader')
jest.mock('../Text', () => 'Text')
jest.mock('../TouchableOpacityBox', () => 'TouchableOpacityBox')

const flush = () => act(async () => {})

describe('AutoGasBanner', () => {
  let renderer: TestRenderer.ReactTestRenderer | undefined

  beforeEach(() => {
    mockTokenBalance = 1000
    mockShow.mockClear()
    mockSubmitAndAwait.mockClear()
    mockHashTagParams.mockClear()
    mockGet.mockClear()
    mockPost.mockClear()
  })

  afterEach(async () => {
    resolveSubmit()
    await flush()
    act(() => renderer?.unmount())
    renderer = undefined
  })

  const render = async () => {
    await act(async () => {
      renderer = TestRenderer.create(React.createElement(Banner))
    })
  }

  it('starts no second swap while the first one submits', async () => {
    await render()
    expect(mockSubmitAndAwait).toHaveBeenCalledTimes(1)

    mockTokenBalance = 900
    await act(async () => {
      renderer?.update(React.createElement(Banner))
    })
    await flush()

    expect(mockShow).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledTimes(1)
  })

  it('keeps the swapping banner up until the first swap submits', async () => {
    await render()
    const visible = () =>
      renderer?.root.findByType('ReAnimatedBox' as never).props.visible
    expect(visible()).toBe(true)

    mockTokenBalance = 900
    await act(async () => {
      renderer?.update(React.createElement(Banner))
    })
    await flush()
    expect(visible()).toBe(true)

    resolveSubmit()
    await flush()
    expect(visible()).toBe(false)
  })

  it('hashes the tag with the amount of this swap', async () => {
    await render()
    expect(mockHashTagParams).toHaveBeenCalledTimes(1)
    expect(mockHashTagParams).toHaveBeenCalledWith({
      wallet: 'WALLET',
      mint: 'MINT',
      amount: mockSwapAmount,
    })
  })
})
