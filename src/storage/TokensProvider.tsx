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
import usePrevious from '../hooks/usePrevious'
import { useBalance } from '../utils/Balance'
import * as Logger from '../utils/logger'
import { useAccountStorage } from './AccountStorageProvider'
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
  const { currentAccount } = useAccountStorage()
  const [restoredVisibleTokens, setRestoredVisibleTokens] =
    useState<CSToken | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])

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

  const updateCSTokens = useCallback((csToken: CSToken) => {
    updateVisibleTokens(csToken)
    setRestoredVisibleTokens(csToken)
  }, [])

  const handleUpdateTokens = useCallback(
    (token: Token, value: boolean) => {
      if (!currentAccount?.address) return

      let newRestoredTokens: CSToken | null = restoredVisibleTokens

      if (!newRestoredTokens) {
        newRestoredTokens = {}
      }

      if (!newRestoredTokens[currentAccount.address]) {
        newRestoredTokens = {
          ...newRestoredTokens,
          [currentAccount.address]: [],
        }
      }

      const key = getKey(token)

      if (!value) {
        const newTokens = newRestoredTokens[currentAccount.address].filter(
          (item) => item !== key,
        )

        updateCSTokens({
          ...newRestoredTokens,
          [currentAccount.address]: newTokens,
        })

        return
      }

      updateCSTokens({
        ...newRestoredTokens,
        [currentAccount.address]: [
          ...newRestoredTokens[currentAccount.address],
          key,
        ],
      })
    },
    [currentAccount, restoredVisibleTokens, updateCSTokens],
  )

  const isActiveToken = useCallback(
    (token: Token) =>
      !!(
        currentAccount &&
        restoredVisibleTokens &&
        restoredVisibleTokens[currentAccount.address]?.includes(getKey(token))
      ),
    [currentAccount, restoredVisibleTokens],
  )

  useAsync(async () => {
    try {
      const response = await restoreVisibleTokens()

      setRestoredVisibleTokens(response)
    } catch {
      Logger.error('Restore visible tokens failed')
    }
  }, [])

  const updateWithSplTokens = useCallback(async () => {
    if (!currentAccount?.address) return

    try {
      const response = await restoreTokensMetadata()

      if (!response[currentAccount.address]) return []

      setTokens((prevTokens) => {
        const newTokens = [...prevTokens]

        Object.keys(splTokensBalance).forEach((key) => {
          const index = newTokens.findIndex(
            (token) => token.type === key || token.mintAddress === key,
          )

          if (index === -1) {
            const token = response[currentAccount.address].find(
              (item) => item.mintAddress === key,
            )

            newTokens.push({
              type: (token?.symbol || key) as Ticker,
              balance: new Balance(
                splTokensBalance[key],
                new BaseCurrencyType((token?.symbol || key) as Ticker, 9),
              ),
              name: token?.name || 'unknown',
              staked: false,
            })
          }
        })

        return newTokens
      })
    } catch {
      Logger.error('Update With Spl Tokens')
    }
  }, [currentAccount, splTokensBalance])

  useEffect(() => {
    updateWithSplTokens()
  }, [updateWithSplTokens])

  const prevAccount = usePrevious(currentAccount?.address)
  useEffect(() => {
    if (prevAccount !== currentAccount?.address) {
      setTokens(defaultTokens)
    }
  }, [currentAccount, defaultTokens, prevAccount])

  const visibleTokens = useMemo(() => {
    if (!currentAccount?.address || !restoredVisibleTokens) return []

    if (!restoredVisibleTokens[currentAccount.address]) return []

    return tokens.filter((token) => {
      const key = getKey(token)

      return restoredVisibleTokens[currentAccount.address].includes(key)
    })
  }, [currentAccount, restoredVisibleTokens, tokens])

  useEffect(() => {
    if (!currentAccount?.address || !restoredVisibleTokens) return

    if (restoredVisibleTokens[currentAccount.address]) return

    updateCSTokens({
      ...restoredVisibleTokens,
      [currentAccount.address]: tokens.map((token) => getKey(token)),
    })
  }, [currentAccount, restoredVisibleTokens, tokens, updateCSTokens])

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
  name?: string
  mintAddress?: string
}

const getKey = (token: Token) =>
  token.staked ? `${token.type}-staked` : token.type
