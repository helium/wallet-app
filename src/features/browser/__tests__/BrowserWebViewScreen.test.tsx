import {
  Keypair,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
import { createSignRequestResolver } from '../../../solana/signRequestResolver'
import BrowserWebViewScreen from '../BrowserWebViewScreen'

const mockShow = jest.fn()

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { uri: 'https://app.example/swap' } }),
  useNavigation: () => ({ goBack: () => {} }),
}))
jest.mock('react-native', () => ({
  View: 'View',
  Platform: { OS: 'ios' },
}))
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}))
jest.mock('react-native-webview', () => ({ WebView: 'WebView' }))
jest.mock('expo-crypto', () => ({
  getRandomValues: (array: Uint8Array) =>
    jest.requireActual('crypto').webcrypto.getRandomValues(array),
}))
jest.mock('uniwind', () => ({ withUniwind: (c: unknown) => c }))
jest.mock('lucide-react-native', () => ({
  Bookmark: 'Bookmark',
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  RefreshCw: 'RefreshCw',
  X: 'X',
}))
jest.mock(
  '@ui/FocusAwareStatusBar',
  () => ({ FocusAwareStatusBar: 'FocusAwareStatusBar' }),
  { virtual: true },
)
jest.mock('@ui/PressableScale', () => ({ PressableScale: 'PressableScale' }), {
  virtual: true,
})
jest.mock('@ui/Text', () => ({ Text: 'Text' }), { virtual: true })
jest.mock('../../../hooks/useBrowser', () => () => ({
  favorites: [],
  addFavorite: () => {},
  removeFavorite: () => {},
}))
jest.mock('../../../solana/SolanaProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
  useSolana: () => ({
    anchorProvider: { wallet: { publicKey: {} } },
    signMsg: () => {},
  }),
}))
// The sheet's show() resolves with the user's decision
jest.mock('../../../solana/WalletSignBottomSheet', () => {
  const ReactActual = jest.requireActual('react')
  return ({
    ref,
    children,
  }: {
    ref: React.Ref<unknown>
    children: React.ReactNode
  }) => {
    ReactActual.useImperativeHandle(ref, () => ({
      show: mockShow,
      hide: () => {},
    }))
    return children
  }
})
jest.mock('../../../storage/AccountStorageProvider', () => ({
  useAccountStorage: () => ({
    currentAccount: {
      address: 'heliumAddress',
      solanaAddress: '11111111111111111111111111111111',
    },
  }),
}))
jest.mock('../../../utils/logger', () => ({
  breadcrumb: () => {},
  error: () => {},
}))
jest.mock('../../../solana/signing', () => ({
  isTransactionMessage: () => false,
}))
jest.mock('../../../utils/solanaUtils', () => ({
  isRequiredSigner: () => true,
}))

// Tell React that this runner wraps renders and presses in act().
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// A transaction the screen decodes, as JSON carries a Uint8Array
const transactionInput = () => ({
  transaction: new VersionedTransaction(
    new TransactionMessage({
      payerKey: Keypair.generate().publicKey,
      recentBlockhash: Keypair.generate().publicKey.toBase58(),
      instructions: [],
    }).compileToV0Message(),
  ).serialize(),
})

// Bytes the screen cannot decode, and the error decoding them throws
const malformedInput = { transaction: new Uint8Array([1]) }
const malformedInputError = () => {
  try {
    VersionedTransaction.deserialize(malformedInput.transaction)
  } catch (e) {
    return (e as Error).message
  }
  throw new Error('malformed input decoded')
}

const render = async () => {
  const webViewPostMessage = jest.fn()
  let renderer: TestRenderer.ReactTestRenderer | undefined
  await act(async () => {
    renderer = TestRenderer.create(<BrowserWebViewScreen />, {
      createNodeMock: (element) =>
        element.type === 'WebView'
          ? { postMessage: webViewPostMessage, injectJavaScript: () => {} }
          : null,
    })
  })
  if (!renderer) throw new Error('render failed')
  const { root } = renderer
  // The native side reports the url of the frame that posted the message
  const post = (senderUrl: string, request: object) =>
    root.findByType('WebView' as never).props.onMessage({
      nativeEvent: { url: senderUrl, data: JSON.stringify(request) },
    })
  const receive = async (senderUrl: string, request: object) => {
    await act(async () => {
      post(senderUrl, request)
    })
  }
  const replies = () =>
    webViewPostMessage.mock.calls.map(([message]) => JSON.parse(message))

  // Runs the script the screen injects into the top frame, in a fake page,
  // and returns the connect request it posts
  const topFrameRequest = async () => {
    const page = new EventTarget() as EventTarget & Record<string, unknown>
    page.crypto = crypto
    const posted: string[] = []
    page.ReactNativeWebView = {
      postMessage: (message: string) => posted.push(message),
    }
    let wallet: { features: Record<string, { connect: () => unknown }> } = {
      features: {},
    }
    page.addEventListener('wallet-standard:register-wallet', (event) =>
      (event as CustomEvent).detail({
        register: (registered: typeof wallet) => {
          wallet = registered
        },
      }),
    )
    // eslint-disable-next-line no-new-func
    new Function(
      'window',
      'document',
      root.findByType('WebView' as never).props
        .injectedJavaScriptBeforeContentLoaded,
    )(page, new EventTarget())
    await act(async () => {})
    wallet.features['standard:connect'].connect()
    return JSON.parse(posted[0]) as { id: number; token: string }
  }
  // Sends the top frame's connect request to the screen as the top page
  const topFrameConnect = async () => {
    const request = await topFrameRequest()
    await receive('https://app.example/swap', request)
    return request.id
  }
  return { root, post, receive, replies, topFrameRequest, topFrameConnect }
}

describe('BrowserWebViewScreen dApp messages', () => {
  beforeEach(() => {
    mockShow.mockReset()
  })

  it('shows a request under the origin of the frame that sent it', async () => {
    mockShow.mockResolvedValue(true)
    const { receive, replies } = await render()

    await receive('https://ads.example/frame?x=1', { id: 7, type: 'connect' })

    expect(mockShow).toHaveBeenCalledTimes(1)
    expect(mockShow.mock.calls[0][0]).toMatchObject({
      type: 'connect',
      url: 'https://ads.example',
    })
    expect(replies()).toEqual([{ id: 7, type: 'connectApproved' }])
  })

  it('shows a sign request under the origin of the frame that sent it', async () => {
    mockShow.mockResolvedValue(false)
    const { receive, replies } = await render()

    await receive('https://ads.example/frame', {
      id: 8,
      type: 'signMessage',
      inputs: [{ message: { 0: 104, 1: 105 } }],
    })

    expect(mockShow).toHaveBeenCalledTimes(1)
    expect(mockShow.mock.calls[0][0]).toMatchObject({
      type: 'signMessage',
      url: 'https://ads.example',
    })
    expect(replies()).toEqual([{ id: 8, type: 'signatureDeclined' }])
  })

  it('runs a top-frame request while an iframe request is pending', async () => {
    const sheet = createSignRequestResolver()
    mockShow.mockImplementation(sheet.next)
    const { receive, replies, topFrameConnect } = await render()

    await receive('https://ads.example/frame', { id: 7, type: 'connect' })
    const topId = await topFrameConnect()
    await act(async () => {
      sheet.settle(true)
    })

    expect(mockShow).toHaveBeenCalledTimes(2)
    expect(mockShow.mock.calls[1][0]).toMatchObject({
      url: 'https://app.example',
    })
    // The top request's sheet declines the iframe's
    expect(replies()).toEqual([
      { id: 7, type: 'connectDeclined' },
      { id: topId, type: 'connectApproved' },
    ])
  })

  it('declines an iframe request while a top-frame request is pending', async () => {
    const sheet = createSignRequestResolver()
    mockShow.mockImplementation(sheet.next)
    const { receive, replies, topFrameConnect } = await render()

    const topId = await topFrameConnect()
    await receive('https://ads.example/frame', { id: 7, type: 'connect' })
    await act(async () => {
      sheet.settle(true)
    })

    expect(mockShow).toHaveBeenCalledTimes(1)
    expect(replies()).toEqual([
      { id: 7, type: 'signatureDeclined', error: 'Request pending' },
      { id: topId, type: 'connectApproved' },
    ])
  })

  it('treats a request with a wrong token as an iframe request', async () => {
    const sheet = createSignRequestResolver()
    mockShow.mockImplementation(sheet.next)
    const { receive, replies, topFrameConnect } = await render()

    await receive('https://app.example/swap', {
      id: 7,
      token: 'guessed',
      type: 'connect',
    })
    const topId = await topFrameConnect()
    await act(async () => {
      sheet.settle(true)
    })

    expect(replies()).toEqual([
      { id: 7, type: 'connectDeclined' },
      { id: topId, type: 'connectApproved' },
    ])
  })

  it.each(['signTransaction', 'signAndSendTransaction'])(
    'runs a top-frame request that arrives with an iframe %s request in one task',
    async (type) => {
      const sheet = createSignRequestResolver()
      mockShow.mockImplementation(sheet.next)
      const { post, replies, topFrameRequest } = await render()
      const topRequest = await topFrameRequest()

      await act(async () => {
        post('https://ads.example/frame', {
          id: 7,
          type,
          inputs: [transactionInput()],
        })
        post('https://app.example/swap', topRequest)
      })
      await act(async () => {
        sheet.settle(true)
      })

      expect(mockShow).toHaveBeenCalledTimes(1)
      expect(mockShow.mock.calls[0][0]).toMatchObject({
        type: 'connect',
        url: 'https://app.example',
      })
      expect(replies()).toEqual([
        { id: 7, type: 'signatureDeclined' },
        { id: topRequest.id, type: 'connectApproved' },
      ])
    },
  )

  it('runs a top-frame request from the page the WebView navigated to', async () => {
    const sheet = createSignRequestResolver()
    mockShow.mockImplementation(sheet.next)
    const { root, receive, replies, topFrameRequest } = await render()
    await act(async () => {
      root
        .findByType('WebView' as never)
        .props.onNavigationStateChange({ url: 'https://other.example/home' })
    })
    const topRequest = await topFrameRequest()

    await receive('https://ads.example/frame', { id: 7, type: 'connect' })
    await receive('https://other.example/home', topRequest)
    await act(async () => {
      sheet.settle(true)
    })

    expect(replies()).toEqual([
      { id: 7, type: 'connectDeclined' },
      { id: topRequest.id, type: 'connectApproved' },
    ])
  })

  it('treats a top-frame token from another origin as an iframe request', async () => {
    const sheet = createSignRequestResolver()
    mockShow.mockImplementation(sheet.next)
    const { receive, replies, topFrameRequest, topFrameConnect } =
      await render()
    // A former top page kept the token and posts it from an iframe
    const { token } = await topFrameRequest()

    await receive('https://ads.example/frame', {
      id: 7,
      token,
      type: 'connect',
    })
    const topId = await topFrameConnect()
    await act(async () => {
      sheet.settle(true)
    })

    expect(replies()).toEqual([
      { id: 7, type: 'connectDeclined' },
      { id: topId, type: 'connectApproved' },
    ])
  })

  it.each(['signAndSendTransaction', 'signTransaction'])(
    'declines a %s request whose transaction cannot be decoded',
    async (type) => {
      const { receive, replies } = await render()
      const error = malformedInputError()

      await receive('https://app.example/swap', {
        id: 7,
        type,
        inputs: [malformedInput],
      })

      expect(error).toBeTruthy()
      expect(mockShow).not.toHaveBeenCalled()
      expect(replies()).toEqual([{ id: 7, type: 'signatureDeclined', error }])
    },
  )

  it('drops a message from an opaque origin with no sheet and no reply', async () => {
    const { receive, replies } = await render()

    await receive('about:srcdoc', { id: 9, type: 'connect' })

    expect(mockShow).not.toHaveBeenCalled()
    expect(replies()).toEqual([])
  })
})
