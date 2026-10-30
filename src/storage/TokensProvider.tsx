import { PublicKey } from '@solana/web3.js'
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { DEFAULT_TOKENS } from '../features/account/logic/visibleTokens'
import * as Logger from '../utils/logger'
import { useAccountStorage } from './AccountStorageProvider'
import {
  CSToken,
  restoreVisibleTokens,
  updateVisibleTokens,
} from './cloudStorage'

const useVisibleTokensHook = () => {
  const { currentAccount } = useAccountStorage()
  const [visibleTokens, setVisibleTokens] = useState<
    Record<string, Set<string>>
  >({
    [currentAccount?.address || '']: DEFAULT_TOKENS,
  })

  useEffect(() => {
    const restore = async () => {
      try {
        const response = await restoreVisibleTokens()

        if (response) {
          setVisibleTokens(
            Object.entries(response).reduce(
              (acc, [key, s]) => {
                acc[key] = new Set([...s, ...DEFAULT_TOKENS])
                return acc
              },
              {} as Record<string, Set<string>>,
            ),
          )
        }
      } catch {
        Logger.error('Restore visible tokens failed')
      }
    }
    void restore()
  }, [])

  const address = currentAccount?.address
  const handleUpdateTokens = useCallback(
    (token: PublicKey, value: boolean) => {
      if (!address) return

      const tokens = new Set(visibleTokens[address] || new Set())
      if (value) {
        tokens.add(token.toBase58())
      } else {
        tokens.delete(token.toBase58())
      }
      const newVisibleTokens = {
        ...visibleTokens,
        [address]: tokens,
      }

      void updateVisibleTokens(
        Object.entries(newVisibleTokens).reduce((acc, [key, s]) => {
          acc[key] = Array.from(s)
          return acc
        }, {} as CSToken),
      )
      setVisibleTokens(newVisibleTokens)
    },
    [address, visibleTokens],
  )

  return {
    visibleTokens,
    setVisibleTokens: handleUpdateTokens,
  }
}

const initialState = {
  visibleTokens: {} as Record<string, Set<string>>,
  setVisibleTokens: (_token: PublicKey, _value: boolean) => {},
}

const TokensContext =
  createContext<ReturnType<typeof useVisibleTokensHook>>(initialState)
const { Provider } = TokensContext

const TokensProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useVisibleTokensHook()}>{children}</Provider>
}

export const useVisibleTokens = () => {
  const { currentAccount } = useAccountStorage()
  const { visibleTokens, setVisibleTokens } = useContext(TokensContext)

  return {
    visibleTokens:
      visibleTokens[currentAccount?.address || ''] || DEFAULT_TOKENS,
    setVisibleTokens,
  }
}

export default TokensProvider
