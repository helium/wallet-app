import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { PairingTypes, SessionTypes } from '@walletconnect/types'
import Config from 'react-native-config'

const useWalletConnectHook = () => {
  const [walletClient, setWalletClient] = useState<WalletConnectClient>()
  const [loginProposal, setLoginProposal] = useState<SessionTypes.Proposal>()
  const [connectionState, setConnectionState] = useState<
    'undetermined' | 'approved' | 'denied'
  >('undetermined')
  const [loginRequestEvent, setLoginRequestEvent] =
    useState<SessionTypes.RequestEvent>()

  const pairClient = useCallback(
    async (uri: string): Promise<PairingTypes.Settled | void> => {
      let client = walletClient
      if (!client) {
        client = await WalletConnectClient.init({
          controller: true,
          projectId: Config.WALLET_CONNECT_PROJECT_ID,
          relayUrl: 'wss://relay.walletconnect.com',
          metadata: {
            name: 'Helium Wallet',
            description: 'Helium Wallet',
            url: Config.WALLET_CONNECT_METADATA_URL,
            icons: ['https://walletconnect.com/walletconnect-logo.png'],
          },
          storageOptions: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            asyncStorage: AsyncStorage,
          },
        })
        setWalletClient(client)

        client.on(
          CLIENT_EVENTS.session.proposal,
          async (proposal: SessionTypes.Proposal) => {
            setLoginProposal(proposal)
          },
        )

        client.on(
          CLIENT_EVENTS.session.request,
          async (requestEvent: SessionTypes.RequestEvent) => {
            if (requestEvent.request.method !== 'personal_sign') return

            setLoginRequestEvent(requestEvent)
          },
        )
      }

      return client.pair({ uri })
    },
    [walletClient],
  )

  const approvePair = useCallback(async (): Promise<
    SessionTypes.Settled | undefined
  > => {
    if (!loginProposal || !walletClient) return new Promise(() => {})
    const { proposer } = loginProposal
    const { metadata } = proposer
    const response: SessionTypes.ResponseInput = {
      state: {
        accounts: [],
      },
      metadata,
    }
    const nextApprovalResponse = await walletClient.approve({
      proposal: loginProposal,
      response,
    })

    setConnectionState('approved')

    return nextApprovalResponse
  }, [loginProposal, walletClient])

  const denyPair = useCallback(async () => {
    if (!loginProposal || !walletClient) return
    const nextDenyResponse = await walletClient.reject({
      proposal: loginProposal,
    })

    setConnectionState('denied')

    return nextDenyResponse
  }, [loginProposal, walletClient])

  const reset = useCallback(async () => {
    if (connectionState === 'undetermined') {
      await denyPair()
    }

    if (walletClient && loginRequestEvent) {
      const { topic } = loginRequestEvent
      walletClient?.disconnect({
        topic,
        reason: {
          code: 1,
          message: 'finished',
        },
      })
    }
    setWalletClient(undefined)
    setLoginProposal(undefined)
    setLoginRequestEvent(undefined)
    setConnectionState('undetermined')
  }, [connectionState, denyPair, loginRequestEvent, walletClient])

  const login = useCallback(
    (opts: { txn: string; address: string }) => {
      if (!loginRequestEvent || !walletClient) return

      const { topic, request } = loginRequestEvent
      const response = {
        topic,
        response: {
          id: request.id,
          jsonrpc: '2.0',
          result: opts,
        },
      }
      return walletClient.respond(response)
    },
    [loginRequestEvent, walletClient],
  )

  return {
    pairClient,
    loginProposal,
    loginRequestEvent,
    approvePair,
    denyPair,
    reset,
    login,
  }
}

const initialState = {
  pairClient: () => new Promise<void>((resolve) => resolve()),
  approvePair: () => new Promise<undefined>((resolve) => resolve(undefined)),
  denyPair: () => new Promise<void>((resolve) => resolve()),
  reset: () => new Promise<void>((resolve) => resolve()),
  login: () => new Promise<void>((resolve) => resolve()),
  loginProposal: undefined,
  loginRequestEvent: undefined,
}

const WalletConnectContext =
  createContext<ReturnType<typeof useWalletConnectHook>>(initialState)
const { Provider } = WalletConnectContext

const WalletConnectProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useWalletConnectHook()}>{children}</Provider>
}

export const useWalletConnect = () => useContext(WalletConnectContext)

export default WalletConnectProvider
