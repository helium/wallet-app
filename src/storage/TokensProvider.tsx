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
import { BaseCurrencyType } from '@helium/currency/build/currency_types'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import { useBalance } from '../utils/Balance'
import {
  CSToken,
  restoreTokensMetadata,
  restoreVisibleTokens,
  updateVisibleTokens,
} from './cloudStorage'

const useTokensHook = () => {
  const {
    dcBalance,
    mobileBalance,
    iotBalance,
    networkBalance,
    networkStakedBalance,
    secBalance,
    solBalance,
    splTokensBalance,
  } = useBalance()
  const [restoredVisibleTokens, setRestoredVisibleTokens] = useState<CSToken[]>(
    [],
  )
  const [tokens, setTokens] = useState<Token[]>([
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
  ])

  const handleUpdateTokens = useCallback(
    (token: Token, value: boolean) => {
      const key = getKey(token)

      if (!restoredVisibleTokens) return

      if (!value) {
        const newTokens = restoredVisibleTokens.filter((item) => item !== key)

        setRestoredVisibleTokens(newTokens)
        updateVisibleTokens(newTokens)

        return
      }

      const newTokens = [...restoredVisibleTokens, key]
      updateVisibleTokens(newTokens)
      setRestoredVisibleTokens(newTokens)
    },
    [restoredVisibleTokens],
  )

  const isActiveToken = useCallback(
    (token: Token) => {
      if (!restoredVisibleTokens) return false

      const key = getKey(token)

      return restoredVisibleTokens.includes(key)
    },
    [restoredVisibleTokens],
  )

  useAsync(async () => {
    try {
      const response = await restoreVisibleTokens()

      if (response) {
        setRestoredVisibleTokens(response)
      }
    } catch {}
  }, [])

  const updateWithSplTokens = useCallback(async () => {
    try {
      const response = await restoreTokensMetadata()

      if (response) {
        setTokens((prevTokens) => {
          const newTokens = [...prevTokens]

          response.forEach((item) => {
            const index = newTokens.findIndex(
              (token) => token.type === item.symbol,
            )

            if (index === -1) {
              newTokens.push({
                type: item.symbol as Ticker,
                balance: new Balance(
                  splTokensBalance[item.mintAddress],
                  new BaseCurrencyType(item.symbol as Ticker, 9),
                ),
                staked: false,
              })
            }
          })

          return newTokens
        })
      }
    } catch {}
  }, [splTokensBalance])

  useEffect(() => {
    updateWithSplTokens()
  }, [updateWithSplTokens])

  const visibleTokens = useMemo(() => {
    if (!restoredVisibleTokens) return tokens

    return tokens.filter((token) => {
      const key = getKey(token)

      return restoredVisibleTokens.includes(key)
    })
  }, [restoredVisibleTokens, tokens])

  const value = useMemo(
    () => ({
      tokens,
      handleUpdateTokens,
      visibleTokens,
      isActiveToken,
    }),
    [tokens, handleUpdateTokens, visibleTokens, isActiveToken],
  )

  return value
}

const initialState = {
  tokens: [],
  handleUpdateTokens: () => {},
  visibleTokens: [],
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

const getKey = (token: Token) =>
  token.staked ? `${token.type}-staked` : token.type
