import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import '@walletconnect/react-native-compat'
import SignClient from '@walletconnect/sign-client'
import {
  PairingTypes,
  SessionTypes,
  SignClientTypes,
} from '@walletconnect/types'
import Config from 'react-native-config'
import * as Logger from '../../utils/logger'

const breadcrumbOpts = { category: 'Wallet Connect' }

const NAMESPACE = 'helium'
const MAINNET = `${NAMESPACE}:mainnet`
type ConnectionState =
  | 'undetermined'
  | 'proposal'
  | 'allowed'
  | 'denied'
  | 'approving'
  | 'approved'
const useWalletConnectHook = () => {
  const [signClient, setSignClient] = useState<SignClient>()
  const [sessionProposal, setSessionProposal] =
    useState<SignClientTypes.EventArguments['session_proposal']>()
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('undetermined')
  const [loginRequest, setLoginRequest] =
    useState<SignClientTypes.EventArguments['session_request']>()
  const [approvalRequest, setApprovalRequest] = useState<{ topic: string }>()

  const pairClient = useCallback(
    async (uri: string): Promise<PairingTypes.Struct | void> => {
      Logger.breadcrumb('pair client requested', breadcrumbOpts)

      try {
        let client = signClient
        if (!client) {
          Logger.breadcrumb('Begin Initialize Client', breadcrumbOpts)

          client = await SignClient.init({
            projectId: Config.WALLET_CONNECT_PROJECT_ID,
            relayUrl: 'wss://relay.walletconnect.com',
            metadata: {
              name: 'Helium Wallet',
              description: 'Helium Wallet',
              url: Config.WALLET_CONNECT_METADATA_URL,
              icons: [],
            },
          })

          Logger.breadcrumb('Client initialized', breadcrumbOpts)

          setSignClient(client)

          client.on('session_proposal', async (proposal) => {
            Logger.breadcrumb('Session proposal created', breadcrumbOpts)
            setSessionProposal(proposal)
            setConnectionState('proposal')
          })

          client.on('session_request', async (loginReqEvent) => {
            if (loginReqEvent.params.request.method !== 'personal_sign') return

            Logger.breadcrumb('Login request event created', breadcrumbOpts)
            setLoginRequest(loginReqEvent)
          })
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
    [setLoginRequest, signClient],
  )

  const approvePair = useCallback(
    async (
      address: string,
    ): Promise<
      | {
          topic: string
          acknowledged: () => Promise<SessionTypes.Struct>
        }
      | undefined
    > => {
      Logger.breadcrumb('approvePair', breadcrumbOpts)

      setConnectionState('approving')

      try {
        if (!sessionProposal || !signClient) {
          Logger.breadcrumb(
            `Approve pair requested, but client not ready. ${JSON.stringify({
              loginProposal: !!sessionProposal,
              walletClient: !!signClient,
            })}`,
            breadcrumbOpts,
          )
          return await new Promise(() => {})
        }

        const nextApprovalResponse = await signClient.approve({
          id: sessionProposal.id,
          namespaces: {
            [NAMESPACE]: {
              accounts: [`${MAINNET}:${address}`],
              methods: ['personal_sign'],
              events: [],
            },
          },
        })

        setConnectionState('approved')

        Logger.breadcrumb('approvePair - success', breadcrumbOpts)
        setApprovalRequest(nextApprovalResponse)
        return nextApprovalResponse
      } catch (err) {
        Logger.breadcrumb('approvePair - fail', breadcrumbOpts)
        Logger.error(err)
        throw err
      }
    },
    [sessionProposal, signClient],
  )

  const allowLogin = useCallback(() => {
    Logger.breadcrumb('allowLogin', breadcrumbOpts)

    setConnectionState('allowed')
  }, [])

  const denyPair = useCallback(async () => {
    Logger.breadcrumb('denyPair', breadcrumbOpts)

    if (!sessionProposal || !signClient) {
      Logger.breadcrumb(
        `Deny pair requested, but client not ready. ${JSON.stringify({
          loginProposal: !!sessionProposal,
          walletClient: !!signClient,
        })}`,
        breadcrumbOpts,
      )
      return
    }

    Logger.breadcrumb('denyPair - begin client reject', breadcrumbOpts)
    const nextDenyResponse = await signClient.reject({
      id: sessionProposal.id,
      reason: { code: 1000, message: 'denied by user' },
    })

    Logger.breadcrumb('denyPair - client reject success', breadcrumbOpts)

    setConnectionState('denied')

    return nextDenyResponse
  }, [sessionProposal, signClient])

  const disconnect = useCallback(async () => {
    Logger.breadcrumb('disconnect', breadcrumbOpts)

    try {
      if (connectionState === 'undetermined') {
        await denyPair()
      }

      if (signClient) {
        if (loginRequest?.topic || approvalRequest?.topic) {
          Logger.breadcrumb('disconnect wallet client - begin', breadcrumbOpts)
          await signClient.disconnect({
            topic: loginRequest?.topic || approvalRequest?.topic || '',
            reason: {
              code: 1,
              message: 'finished',
            },
          })
          Logger.breadcrumb(
            'disconnect wallet client - success',
            breadcrumbOpts,
          )
        } else if (
          sessionProposal?.id &&
          connectionState !== 'undetermined' &&
          connectionState !== 'denied'
        ) {
          signClient.reject({
            id: sessionProposal.id,
            reason: { code: 2000, message: 'Login Process Closed' },
          })
        }
      }
      setSignClient(undefined)
      setSessionProposal(undefined)
      setLoginRequest(undefined)
      setApprovalRequest(undefined)
      setConnectionState('undetermined')
    } catch (err) {
      Logger.breadcrumb('disconnect - fail', breadcrumbOpts)
      Logger.error(err)
      throw err
    }
  }, [
    approvalRequest,
    connectionState,
    denyPair,
    loginRequest,
    sessionProposal,
    signClient,
  ])

  const login = useCallback(
    async (opts: { txn: string; address: string }) => {
      Logger.breadcrumb('login', breadcrumbOpts)

      try {
        if (!loginRequest || !signClient) {
          Logger.breadcrumb(
            `Login requested, but client not ready. ${JSON.stringify({
              loginProposal: !!sessionProposal,
              walletClient: !!signClient,
            })}`,
            breadcrumbOpts,
          )
          return
        }

        const { topic } = loginRequest

        const responseBody = {
          topic,
          response: {
            id: loginRequest.id,
            jsonrpc: '2.0',
            result: opts,
          },
        }
        await signClient.respond(responseBody)
        Logger.breadcrumb('login - success', breadcrumbOpts)
      } catch (err) {
        Logger.breadcrumb('login - fail', breadcrumbOpts)
        Logger.error(err)
        throw err
      }
    },
    [sessionProposal, loginRequest, signClient],
  )

  return {
    allowLogin,
    approvePair,
    connectionState,
    denyPair,
    disconnect,
    login,
    sessionProposal,
    loginRequest,
    pairClient,
  }
}

const initialState = {
  approvePair: () => new Promise<undefined>((resolve) => resolve(undefined)),
  allowLogin: () => undefined,
  connectionState: 'undetermined' as ConnectionState,
  denyPair: () => new Promise<void>((resolve) => resolve()),
  disconnect: () => new Promise<void>((resolve) => resolve()),
  login: () => new Promise<void>((resolve) => resolve()),
  sessionProposal: undefined,
  loginRequest: undefined,
  pairClient: () => new Promise<void>((resolve) => resolve()),
}

const WalletConnectContext =
  createContext<ReturnType<typeof useWalletConnectHook>>(initialState)
const { Provider } = WalletConnectContext

const WalletConnectProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useWalletConnectHook()}>{children}</Provider>
}

export const useWalletConnect = () => useContext(WalletConnectContext)

export default WalletConnectProvider
