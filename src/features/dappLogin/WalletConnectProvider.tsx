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
import * as Logger from '../../utils/logger'

const breadcrumbOpts = { category: 'Wallet Connect' }

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
      Logger.breadcrumb('pair client requested', breadcrumbOpts)

      try {
        let client = walletClient
        if (!client) {
          Logger.breadcrumb('Begin Initialize Client', breadcrumbOpts)

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

          Logger.breadcrumb('Client initialized', breadcrumbOpts)

          setWalletClient(client)

          client.on(
            CLIENT_EVENTS.session.proposal,
            async (proposal: SessionTypes.Proposal) => {
              Logger.breadcrumb('Login proposal created', breadcrumbOpts)
              setLoginProposal(proposal)
            },
          )

          client.on(
            CLIENT_EVENTS.session.request,
            async (requestEvent: SessionTypes.RequestEvent) => {
              if (requestEvent.request.method !== 'personal_sign') return

              Logger.breadcrumb('Login request event created', breadcrumbOpts)
              setLoginRequestEvent(requestEvent)
            },
          )
        } else {
          Logger.breadcrumb('Client already initialized', breadcrumbOpts)
        }

        Logger.breadcrumb('client.pair - begin', breadcrumbOpts)
        const pairResponse = await client.pair({ uri })
        Logger.breadcrumb('client.pair - success', breadcrumbOpts)
        return pairResponse
      } catch (err) {
        Logger.breadcrumb('pairClient - fail', breadcrumbOpts)
        Logger.error(err)
        throw err
      }
    },
    [walletClient],
  )

  const approvePair = useCallback(async (): Promise<
    SessionTypes.Settled | undefined
  > => {
    Logger.breadcrumb('approvePair', breadcrumbOpts)

    try {
      if (!loginProposal || !walletClient) {
        Logger.breadcrumb(
          `Approve pair requested, but client not ready. ${JSON.stringify({
            loginProposal: !!loginProposal,
            walletClient: !!walletClient,
          })}`,
          breadcrumbOpts,
        )
        return await new Promise(() => {})
      }

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

      Logger.breadcrumb('approvePair - success', breadcrumbOpts)
      return nextApprovalResponse
    } catch (err) {
      Logger.breadcrumb('approvePair - fail', breadcrumbOpts)
      Logger.error(err)
      throw err
    }
  }, [loginProposal, walletClient])

  const denyPair = useCallback(async () => {
    Logger.breadcrumb('denyPair', breadcrumbOpts)

    if (!loginProposal || !walletClient) {
      Logger.breadcrumb(
        `Deny pair requested, but client not ready. ${JSON.stringify({
          loginProposal: !!loginProposal,
          walletClient: !!walletClient,
        })}`,
        breadcrumbOpts,
      )
      return
    }

    Logger.breadcrumb('denyPair - begin client reject', breadcrumbOpts)
    const nextDenyResponse = await walletClient.reject({
      proposal: loginProposal,
    })

    Logger.breadcrumb('denyPair - client reject success', breadcrumbOpts)

    setConnectionState('denied')

    return nextDenyResponse
  }, [loginProposal, walletClient])

  const disconnect = useCallback(async () => {
    Logger.breadcrumb('disconnect', breadcrumbOpts)

    try {
      if (connectionState === 'undetermined') {
        await denyPair()
      }

      if (walletClient && loginRequestEvent) {
        Logger.breadcrumb('disconnect wallet client - begin', breadcrumbOpts)
        const { topic } = loginRequestEvent
        await walletClient.disconnect({
          topic,
          reason: {
            code: 1,
            message: 'finished',
          },
        })

        Logger.breadcrumb('disconnect wallet client - success', breadcrumbOpts)
      }
      setWalletClient(undefined)
      setLoginProposal(undefined)
      setLoginRequestEvent(undefined)
      setConnectionState('undetermined')
    } catch (err) {
      Logger.breadcrumb('disconnect - fail', breadcrumbOpts)
      Logger.error(err)
      throw err
    }
  }, [connectionState, denyPair, loginRequestEvent, walletClient])

  const login = useCallback(
    async (opts: { txn: string; address: string }) => {
      Logger.breadcrumb('login', breadcrumbOpts)

      try {
        if (!loginRequestEvent || !walletClient) {
          Logger.breadcrumb(
            `Login requested, but client not ready. ${JSON.stringify({
              loginProposal: !!loginProposal,
              walletClient: !!walletClient,
            })}`,
            breadcrumbOpts,
          )
          return
        }

        const { topic, request } = loginRequestEvent
        const responseBody = {
          topic,
          response: {
            id: request.id,
            jsonrpc: '2.0',
            result: opts,
          },
        }
        await walletClient.respond(responseBody)
        Logger.breadcrumb('login - success', breadcrumbOpts)
      } catch (err) {
        Logger.breadcrumb('login - fail', breadcrumbOpts)
        Logger.error(err)
        throw err
      }
    },
    [loginProposal, loginRequestEvent, walletClient],
  )

  return {
    pairClient,
    loginProposal,
    loginRequestEvent,
    approvePair,
    denyPair,
    disconnect,
    login,
  }
}

const initialState = {
  pairClient: () => new Promise<void>((resolve) => resolve()),
  approvePair: () => new Promise<undefined>((resolve) => resolve(undefined)),
  denyPair: () => new Promise<void>((resolve) => resolve()),
  disconnect: () => new Promise<void>((resolve) => resolve()),
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
