import { createElement } from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import WalletConnectProvider, {
  useWalletConnect,
} from '../WalletConnectProvider'

jest.mock('@walletconnect/react-native-compat', () => ({}))
jest.mock('@utils/config', () => ({ __esModule: true, default: {} }), {
  virtual: true,
})

// Fake of @walletconnect/sign-client 2.26: every SignClient.init shares one
// Core, so the relay keeps delivering dApp messages to the first client's
// engine, while each client keeps its own proposal and session stores. The
// engine emits one session_request at a time and holds the rest in a queue
// until the wallet responds to the one in flight.
jest.mock('@walletconnect/sign-client', () => {
  class FakeSignClient {
    proposals = new Map<number, string>()

    sessions = new Map<string, { topic: string; pairingTopic: string }>()

    session = {
      getAll: ({ topic }: { topic: string }) =>
        [...this.sessions.values()].filter((entry) => entry.topic === topic),
    }

    listeners: Record<string, (args: unknown) => void> = {}

    on(event: string, listener: (args: unknown) => void) {
      this.listeners[event] = listener
    }

    pair = async ({ uri }: { uri: string }) => ({
      topic: `pairing-${uri.replace('wc:', '')}`,
    })

    async approve({ id }: { id: number }) {
      if (!this.proposals.has(id)) {
        throw new Error(`No matching key. proposal id doesn't exist: ${id}`)
      }
      const topic = `session-${id}`
      this.sessions.set(topic, {
        topic,
        pairingTopic: this.proposals.get(id) as string,
      })
      return { topic, acknowledged: async () => ({}) }
    }

    async reject({ id }: { id: number }) {
      this.proposals.delete(id)
    }

    async respond({
      topic,
      response,
    }: {
      topic: string
      response: {
        id: number
        result?: unknown
        error?: { code: number; message: string }
      }
    }) {
      if (!this.sessions.has(topic)) {
        throw new Error(
          `No matching key. session topic doesn't exist: ${topic}`,
        )
      }
      if (response.error) {
        relay.errors.push({ topic, id: response.id, error: response.error })
      } else {
        relay.responses.push({
          topic,
          id: response.id,
          result: response.result,
        })
      }
      relay.finishRequest(response.id)
    }

    async disconnect({ topic }: { topic: string }) {
      if (!this.sessions.has(topic)) {
        throw new Error(
          `No matching key. session topic doesn't exist: ${topic}`,
        )
      }
      this.sessions.delete(topic)
    }
  }

  const relay = {
    subscriber: undefined as FakeSignClient | undefined,
    responses: [] as { topic: string; id: number; result: unknown }[],
    errors: [] as {
      topic: string
      id: number
      error: { code: number; message: string }
    }[],
    requestQueue: [] as { id: number; topic: string }[],
    requestInFlight: undefined as number | undefined,
    initCalls: 0,
    initHold: undefined as Promise<void> | undefined,
    reset() {
      relay.subscriber = undefined
      relay.responses = []
      relay.errors = []
      relay.requestQueue = []
      relay.requestInFlight = undefined
      relay.initCalls = 0
      relay.initHold = undefined
    },
    holdInit() {
      let release = () => {}
      relay.initHold = new Promise<void>((resolve) => {
        release = resolve
      })
      return release
    },
    propose(id: number) {
      const pairingTopic = `pairing-${id}`
      relay.subscriber?.proposals.set(id, pairingTopic)
      relay.subscriber?.listeners.session_proposal?.({
        id,
        params: { pairingTopic },
      })
    },
    seedSession(topic: string, pairingTopic: string) {
      relay.subscriber?.sessions.set(topic, { topic, pairingTopic })
    },
    requestLogin(topic: string, id: number) {
      relay.requestQueue.push({ id, topic })
      relay.emitNextRequest()
    },
    emitNextRequest() {
      const next = relay.requestQueue[0]
      if (relay.requestInFlight !== undefined || !next) return
      relay.requestQueue.shift()
      relay.requestInFlight = next.id
      relay.subscriber?.listeners.session_request?.({
        id: next.id,
        topic: next.topic,
        params: { request: { method: 'personal_sign', params: [] } },
      })
    },
    finishRequest(id: number) {
      if (relay.requestInFlight !== id) return
      relay.requestInFlight = undefined
      relay.emitNextRequest()
    },
    deleteSession(topic: string) {
      relay.subscriber?.sessions.delete(topic)
    },
  }

  return {
    __esModule: true,
    relay,
    default: {
      init: async () => {
        relay.initCalls += 1
        await relay.initHold
        const client = new FakeSignClient()
        relay.subscriber = relay.subscriber ?? client
        return client
      },
    },
  }
})

type Relay = {
  responses: { topic: string; id: number; result: unknown }[]
  errors: {
    topic: string
    id: number
    error: { code: number; message: string }
  }[]
  initCalls: number
  reset: () => void
  holdInit: () => () => void
  propose: (id: number) => void
  requestLogin: (topic: string, id: number) => void
  deleteSession: (topic: string) => void
  seedSession: (topic: string, pairingTopic: string) => void
}

const { relay } = jest.requireMock<{ relay: Relay }>(
  '@walletconnect/sign-client',
)

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true, __DEV__: false })

type WalletConnect = ReturnType<typeof useWalletConnect>

const renderWalletConnect = () => {
  const latest: { current?: WalletConnect } = {}
  const Probe = () => {
    latest.current = useWalletConnect()
    return null
  }
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(
      createElement(WalletConnectProvider, null, createElement(Probe)),
    )
  })
  return {
    walletConnect: () => latest.current as WalletConnect,
    unmount: () => act(() => renderer?.unmount()),
  }
}

const ADDRESS = 'wallet-address'

const signDappLogin = async (
  walletConnect: () => WalletConnect,
  proposalId: number,
  requestId: number,
) => {
  await act(async () => {
    await walletConnect().pairClient(`wc:${proposalId}`)
  })
  await act(async () => relay.propose(proposalId))
  let topic = ''
  await act(async () => {
    const approval = await walletConnect().approvePair(ADDRESS)
    topic = approval?.topic ?? ''
  })
  await act(async () => relay.requestLogin(topic, requestId))
  await act(async () => {
    await walletConnect().login({ txn: `txn-${requestId}`, address: ADDRESS })
  })
}

const loginToDapp = async (
  walletConnect: () => WalletConnect,
  proposalId: number,
  requestId: number,
) => {
  await signDappLogin(walletConnect, proposalId, requestId)
  await act(async () => {
    await walletConnect().disconnect()
  })
}

describe('WalletConnectProvider', () => {
  beforeEach(() => {
    relay.reset()
  })

  it('signs a second dApp login after the first one disconnects', async () => {
    const { walletConnect, unmount } = renderWalletConnect()

    await loginToDapp(walletConnect, 1, 101)
    await loginToDapp(walletConnect, 2, 202)

    expect(relay.responses).toEqual([
      {
        topic: 'session-1',
        id: 101,
        result: { txn: 'txn-101', address: ADDRESS },
      },
      {
        topic: 'session-2',
        id: 202,
        result: { txn: 'txn-202', address: ADDRESS },
      },
    ])
    unmount()
  })

  it('initializes one SignClient when pairClient runs twice before init resolves', async () => {
    const releaseInit = relay.holdInit()
    const { walletConnect, unmount } = renderWalletConnect()

    await act(async () => {
      const pairs = [
        walletConnect().pairClient('wc:1'),
        walletConnect().pairClient('wc:2'),
      ]
      releaseInit()
      await Promise.all(pairs)
    })

    expect(relay.initCalls).toBe(1)
    unmount()
  })

  it('clears the login and signs again after the peer deleted the session', async () => {
    const { walletConnect, unmount } = renderWalletConnect()

    await signDappLogin(walletConnect, 1, 101)
    await act(async () => relay.deleteSession('session-1'))
    await act(async () => {
      await expect(walletConnect().disconnect()).resolves.toBeUndefined()
    })

    expect(walletConnect().loginRequest).toBeUndefined()

    await loginToDapp(walletConnect, 2, 202)

    expect(relay.responses).toEqual([
      {
        topic: 'session-1',
        id: 101,
        result: { txn: 'txn-101', address: ADDRESS },
      },
      {
        topic: 'session-2',
        id: 202,
        result: { txn: 'txn-202', address: ADDRESS },
      },
    ])
    unmount()
  })

  it('rejects a replayed login request from another pairing and signs the new login', async () => {
    const { walletConnect, unmount } = renderWalletConnect()

    await act(async () => {
      await walletConnect().pairClient('wc:2')
    })
    await act(async () => {
      relay.seedSession('session-old', 'pairing-old')
      relay.requestLogin('session-old', 99)
    })

    expect(walletConnect().loginRequest).toBeUndefined()

    await loginToDapp(walletConnect, 2, 202)

    expect(relay.responses).toEqual([
      {
        topic: 'session-2',
        id: 202,
        result: { txn: 'txn-202', address: ADDRESS },
      },
    ])
    expect(relay.errors).toEqual([
      {
        topic: 'session-old',
        id: 99,
        error: { code: 5000, message: 'User rejected.' },
      },
    ])
    unmount()
  })
})
