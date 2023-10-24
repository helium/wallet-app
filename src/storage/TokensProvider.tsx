import { DC_MINT, HNT_MINT, IOT_MINT, MOBILE_MINT } from '@helium/spl-utils'
import { NATIVE_MINT } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import * as Logger from '../utils/logger'
import { useAccountStorage } from './AccountStorageProvider'
import {
  CSToken,
  restoreVisibleTokens,
  updateVisibleTokens,
} from './cloudStorage'

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
export const DEFAULT_TOKENS = new Set([
  HNT_MINT.toBase58(),
  MOBILE_MINT.toBase58(),
  IOT_MINT.toBase58(),
  DC_MINT.toBase58(),
  NATIVE_MINT.toBase58(),
  USDC_MINT.toBase58(),
])

const useVisibleTokensHook = () => {
  const { currentAccount } = useAccountStorage()
  const [visibleTokens, setVisibleTokens] = useState<
    Record<string, Set<string>>
  >({
    [currentAccount?.address || '']: DEFAULT_TOKENS,
  })

  useAsync(async () => {
    try {
      const response = await restoreVisibleTokens()

      if (response) {
        setVisibleTokens(
          Object.entries(response).reduce((acc, [key, s]) => {
            acc[key] = new Set([...s, ...DEFAULT_TOKENS])
            return acc
          }, {} as Record<string, Set<string>>),
        )
      }
    } catch {
      Logger.error('Restore visible tokens failed')
    }
  }, [])

  const handleUpdateTokens = useCallback(
    (token: PublicKey, value: boolean) => {
      if (!currentAccount?.address) return

      const tokens = new Set(visibleTokens[currentAccount.address] || new Set())
      if (value) {
        tokens.add(token.toBase58())
      } else {
        tokens.delete(token.toBase58())
      }
      const newVisibleTokens = {
        ...visibleTokens,
        [currentAccount.address]: tokens,
      }

      updateVisibleTokens(
        Object.entries(newVisibleTokens).reduce((acc, [key, s]) => {
          acc[key] = Array.from(s)
          return acc
        }, {} as CSToken),
      )
      setVisibleTokens(newVisibleTokens)
    },
    [currentAccount?.address, visibleTokens],
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
