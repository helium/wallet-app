import Balance, {
  NetworkTokens,
  MobileTokens,
  IotTokens,
  DataCredits,
  SecurityTokens,
  SolTokens,
  Ticker,
  AnyCurrencyType,
} from '@helium/currency'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import { useBalance } from '../utils/Balance'
import { CSToken, restoreTokens, updateTokens } from './cloudStorage'

const useTokensHook = () => {
  const {
    dcBalance,
    mobileBalance,
    iotBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    solBalance,
  } = useBalance()
  const [restoredTokens, setRestoredTokens] = useState<CSToken[]>([])

  const defaultTokens: Token[] = useMemo(
    () => [
      {
        type: 'HNT',
        balance: networkBalance as Balance<NetworkTokens>,
        staked: false,
      },
      {
        type: 'HNT',
        balance: networkStakedBalance as Balance<NetworkTokens>,
        staked: true,
      },
      {
        type: 'MOBILE',
        balance: mobileBalance as Balance<MobileTokens>,
        staked: false,
      },
      {
        type: 'IOT',
        balance: iotBalance as Balance<IotTokens>,
        staked: false,
      },
      {
        type: 'DC',
        balance: dcBalance as Balance<DataCredits>,
        staked: false,
      },
      {
        type: 'HST',
        balance: secBalance as Balance<SecurityTokens>,
        staked: false,
      },
      {
        type: 'SOL',
        balance: solBalance as Balance<SolTokens>,
        staked: false,
      },
    ],
    [
      dcBalance,
      iotBalance,
      mobileBalance,
      networkBalance,
      networkStakedBalance,
      secBalance,
      solBalance,
    ],
  )

  const tokens = useMemo(() => [...defaultTokens], [defaultTokens])

  const handleUpdateTokens = useCallback(
    (token: Token, value: boolean) => {
      const key = token.staked ? `${token.type}-staked` : token.type

      if (!restoredTokens) return

      if (!value) {
        const newTokens = restoredTokens.filter((f) => f.symbol !== key)

        setRestoredTokens(newTokens)
        updateTokens(newTokens)

        return
      }

      const newTokens = [...restoredTokens]
      updateTokens(newTokens)
      setRestoredTokens(newTokens)
    },
    [restoredTokens],
  )

  const tokensVisible = useMemo(() => {
    if (!restoredTokens) return []

    return tokens.filter((f) => {
      const key = f.staked ? `${f.type}-staked` : f.type

      return restoredTokens.find((item) => item.symbol !== key)
    })
  }, [restoredTokens, tokens])

  const isActiveToken = useCallback(
    (token: Token) => {
      if (!restoredTokens) return false

      const key = token.staked ? `${token.type}-staked` : token.type

      return !restoredTokens.find((item) => item.symbol !== key)
    },
    [restoredTokens],
  )

  useAsync(async () => {
    try {
      const response = await restoreTokens()

      if (response) {
        setRestoredTokens(response)
      }
    } catch {}
  }, [])

  const value = useMemo(
    () => ({
      tokens,
      defaultTokens,
      handleUpdateTokens,
      tokensVisible,
      isActiveToken,
    }),
    [tokens, defaultTokens, handleUpdateTokens, tokensVisible, isActiveToken],
  )

  return value
}

const initialState = {
  tokens: [],
  defaultTokens: [],
  handleUpdateTokens: () => {},
  tokensVisible: [],
  isActiveToken: () => false,
}

const TokensContext =
  createContext<ReturnType<typeof useTokensHook>>(initialState)
const { Provider } = TokensContext

const TokensProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useTokensHook()}>{children}</Provider>
}

export const useTokens = () => useContext(TokensContext)

export default TokensProvider

//
// Utils
//

export type Token = {
  type: Ticker
  balance: Balance<AnyCurrencyType>
  staked: boolean
}
