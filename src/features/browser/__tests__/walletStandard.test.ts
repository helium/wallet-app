import walletStandard from '../walletStandard'

type Request = { id: number; type: string; token?: string }
type Reply = { id: number; type: string; data?: unknown; error?: string }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Wallet = { features: Record<string, any> }

const address = 'HeliumAddress1111111111111111111111111111111'
const pubKey = [1, 2, 3]
// The app's per-mount token, injected into the top frame only
const token = 'top-frame-token'

const flush = () => new Promise((resolve) => setImmediate(resolve))

const track = (promise: Promise<unknown>) => {
  const settled = { state: 'pending', error: undefined as unknown }
  promise.then(
    () => {
      settled.state = 'resolved'
    },
    (error) => {
      settled.state = 'rejected'
      settled.error = error
    },
  )
  return settled
}

// Runs the injected script in a fake WebView: iOS replies arrive on window,
// Android replies on document. The page script runs first in the same scope.
const injectInto = async (isAndroid: boolean, pageScript = '') => {
  const window = new EventTarget() as EventTarget & Record<string, unknown>
  const document = new EventTarget()
  window.crypto = crypto
  const requests: Request[] = []
  window.ReactNativeWebView = {
    postMessage: (message: string) => requests.push(JSON.parse(message)),
  }
  let wallet: Wallet | undefined
  window.addEventListener('wallet-standard:register-wallet', (event) =>
    (event as CustomEvent).detail({
      register: (registered: Wallet) => {
        wallet = registered
      },
    }),
  )
  // The app injects this script as source text, so the test evaluates it too
  // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
  const inject = new Function(
    'window',
    'document',
    `${pageScript}; ${walletStandard}; return injectWalletStandard`,
  )(window, document)
  await inject(address, pubKey, isAndroid, token)

  const replyTarget = isAndroid ? document : window
  // The native side's postMessage dispatches a MessageEvent with no source
  const nativeReply = (reply: Reply) =>
    replyTarget.dispatchEvent(
      new MessageEvent('message', { data: JSON.stringify(reply) }),
    )
  // A page or iframe postMessage carries the sender window as its source
  const pageReply = (reply: Reply) =>
    replyTarget.dispatchEvent(
      Object.assign(new Event('message'), {
        data: JSON.stringify(reply),
        source: {},
      }),
    )
  const lastRequest = () => requests[requests.length - 1]

  const connect = async () => {
    const connected = wallet?.features['standard:connect'].connect()
    nativeReply({ id: lastRequest().id, type: 'connectApproved' })
    await connected
  }

  return {
    wallet: wallet as Wallet,
    nativeReply,
    pageReply,
    lastRequest,
    connect,
  }
}

type Setup = Awaited<ReturnType<typeof injectInto>>

const requestTypes: {
  name: string
  connected: boolean
  send: (wallet: Wallet) => Promise<unknown>
  approved: (id: number) => Reply
  declined: (id: number, error: string) => Reply
}[] = [
  {
    name: 'connect',
    connected: false,
    send: (wallet) => wallet.features['standard:connect'].connect(),
    approved: (id) => ({ id, type: 'connectApproved' }),
    declined: (id, error) => ({ id, type: 'connectDeclined', error }),
  },
  {
    name: 'signAndSendTransaction',
    connected: true,
    send: (wallet) =>
      wallet.features['solana:signAndSendTransaction'].signAndSendTransaction(
        {},
      ),
    approved: (id) => ({
      id,
      type: 'transactionSigned',
      data: [{ signature: { 0: 1 } }],
    }),
    declined: (id, error) => ({ id, type: 'signatureDeclined', error }),
  },
  {
    name: 'signTransaction',
    connected: true,
    send: (wallet) =>
      wallet.features['solana:signTransaction'].signTransaction({}),
    approved: (id) => ({
      id,
      type: 'transactionSigned',
      data: [{ signedTransaction: { 0: 1 } }],
    }),
    declined: (id, error) => ({ id, type: 'signatureDeclined', error }),
  },
  {
    name: 'signMessage',
    connected: true,
    send: (wallet) => wallet.features['solana:signMessage'].signMessage({}),
    approved: (id) => ({
      id,
      type: 'messageSigned',
      data: [{ signature: [1], signedMessage: [1] }],
    }),
    declined: (id, error) => ({ id, type: 'signatureDeclined', error }),
  },
]

describe.each([
  ['iOS', false],
  ['Android', true],
])('injected wallet on %s', (_platform, isAndroid) => {
  let setup: Setup
  beforeEach(async () => {
    setup = await injectInto(isAndroid)
  })

  describe.each(requestTypes)('$name', (request) => {
    const send = async () => {
      if (request.connected) await setup.connect()
      const settled = track(request.send(setup.wallet))
      return { settled, id: setup.lastRequest().id }
    }

    it('ignores a page or iframe message with the request id', async () => {
      const { settled, id } = await send()

      setup.pageReply(request.declined(id, 'Request pending'))
      setup.pageReply(request.approved(id))
      await flush()
      expect(settled.state).toBe('pending')

      setup.nativeReply(request.approved(id))
      await flush()
      expect(settled.state).toBe('resolved')
    })

    it('sends the top frame token with the request', async () => {
      await send()
      expect(setup.lastRequest().token).toBe(token)
    })

    it('rejects on a native decline with the request id', async () => {
      const { settled, id } = await send()

      setup.nativeReply(request.declined(id, 'Wallet not ready'))
      await flush()
      expect(settled.state).toBe('rejected')
      expect((settled.error as Error).message).toBe('Wallet not ready')
    })
  })

  describe('request ids', () => {
    afterEach(() => jest.restoreAllMocks())

    const fillRandomBytes = (byte: number) =>
      jest.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
        new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(
          byte,
        )
        return array
      })

    it('ignores a native decline for any counter id', async () => {
      // An iframe that sends a request with a guessed id gets the app to
      // decline that id to the top page
      const settled = track(setup.wallet.features['standard:connect'].connect())
      const { id } = setup.lastRequest()
      for (let guess = 1; guess <= 1000; guess += 1) {
        setup.nativeReply({
          id: guess,
          type: 'connectDeclined',
          error: 'Request pending',
        })
      }
      await flush()
      expect(settled.state).toBe('pending')

      setup.nativeReply({ id, type: 'connectApproved' })
      await flush()
      expect(settled.state).toBe('resolved')
    })

    it('draws the id from the CSPRNG as a 53-bit integer', async () => {
      fillRandomBytes(0xff)
      setup.wallet.features['standard:connect'].connect()
      expect(setup.lastRequest().id).toBe(Number.MAX_SAFE_INTEGER)
    })

    it("never sends id 0, which the app's not-ready reply skips", async () => {
      fillRandomBytes(0)
      setup.wallet.features['standard:connect'].connect()
      expect(setup.lastRequest().id).toBeGreaterThan(0)
    })

    it('draws the id when the page declares its own crypto', async () => {
      // A top-level let in a page script hides the global from later scripts
      const page = await injectInto(isAndroid, 'let crypto')
      const settled = track(page.wallet.features['standard:connect'].connect())
      await flush()
      expect(settled.state).toBe('pending')
      expect(page.lastRequest().id).toBeGreaterThan(0)
    })
  })
})
