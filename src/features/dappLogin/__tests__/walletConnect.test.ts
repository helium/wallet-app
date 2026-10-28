import { createElement } from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import WalletConnectProvider, {
  useWalletConnect,
} from '../WalletConnectProvider'

jest.mock('@walletconnect/react-native-compat', () => ({}))
jest.mock('react-native-config', () => ({}))

// Fake of @walletconnect/sign-client 2.26: every SignClient.init shares one
// Core, so the relay keeps delivering dApp messages to the first client's
// engine, while each client keeps its own proposal and session stores.
jest.mock('@walletconnect/sign-client', () => {
  class FakeSignClient {
    proposals = new Set<number>()

    sessions = new Set<string>()

    listeners: Record<string, (args: unknown) => void> = {}

    on(event: string, listener: (args: unknown) => void) {
      this.listeners[event] = listener
    }

    pair = async () => ({})

    async approve({ id }: { id: number }) {
      if (!this.proposals.has(id)) {
        throw new Error(`No matching key. proposal id doesn't exist: ${id}`)
      }
      const topic = `session-${id}`
      this.sessions.add(topic)
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
      response: { id: number; result: unknown }
    }) {
      if (!this.sessions.has(topic)) {
        throw new Error(
          `No matching key. session topic doesn't exist: ${topic}`,
        )
      }
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      relay.responses.push({ topic, id: response.id, result: response.result })
    }

    async disconnect({ topic }: { topic: string }) {
      this.sessions.delete(topic)
    }
  }

  const relay = {
    subscriber: undefined as FakeSignClient | undefined,
    responses: [] as { topic: string; id: number; result: unknown }[],
    propose(id: number) {
      relay.subscriber?.proposals.add(id)
      relay.subscriber?.listeners.session_proposal?.({ id, params: {} })
    },
    requestLogin(topic: string, id: number) {
      relay.subscriber?.listeners.session_request?.({
        id,
        topic,
        params: { request: { method: 'personal_sign', params: [] } },
      })
    },
  }

  return {
    __esModule: true,
    relay,
    default: {
      init: async () => {
        const client = new FakeSignClient()
        relay.subscriber = relay.subscriber ?? client
        return client
      },
    },
  }
})

type Relay = {
  responses: { topic: string; id: number; result: unknown }[]
  propose: (id: number) => void
  requestLogin: (topic: string, id: number) => void
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

const loginToDapp = async (
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
  await act(async () => {
    await walletConnect().disconnect()
  })
}

describe('WalletConnectProvider', () => {
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
})
