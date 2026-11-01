import React from 'react'
import TestRenderer, { act } from 'react-test-renderer'
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
  useSolana: () => ({ anchorProvider: {}, signMsg: () => {} }),
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
  const receive = async (senderUrl: string, request: object) => {
    await act(async () => {
      root.findByType('WebView' as never).props.onMessage({
        nativeEvent: { url: senderUrl, data: JSON.stringify(request) },
      })
    })
  }
  const replies = () =>
    webViewPostMessage.mock.calls.map(([message]) => JSON.parse(message))
  return { receive, replies }
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

  it('drops a message from an opaque origin with no sheet and no reply', async () => {
    const { receive, replies } = await render()

    await receive('about:srcdoc', { id: 9, type: 'connect' })

    expect(mockShow).not.toHaveBeenCalled()
    expect(replies()).toEqual([])
  })
})
