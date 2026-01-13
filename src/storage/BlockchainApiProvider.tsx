import { createClient, type APIRouter } from '@helium/blockchain-api'
import React, { createContext, useContext, useMemo } from 'react'
import { useSelector } from 'react-redux'
import Config from 'react-native-config'
import { RootState } from '../store/rootReducer'

const BlockchainApiContext = createContext<APIRouter | null>(null)

export const BlockchainApiProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const cluster = useSelector(
    (state: RootState) => state.app.cluster || 'mainnet-beta',
  )

  const client = useMemo<APIRouter | null>(() => {
    const url =
      cluster === 'devnet'
        ? Config.DEVNET_HELIUM_TRANSACTION_API ||
          process.env.DEVNET_HELIUM_TRANSACTION_API
        : Config.MAINNET_HELIUM_TRANSACTION_API ||
          process.env.MAINNET_HELIUM_TRANSACTION_API

    if (!url || url.trim() === '') {
      console.error(
        `Missing blockchain API URL configuration for cluster: ${cluster}. Please set ${
          cluster === 'devnet' ? 'DEVNET' : 'MAINNET'
        }_HELIUM_TRANSACTION_API in your .env file.`,
      )
      return null
    }

    try {
      return createClient({ url: url.trim() })
    } catch (error) {
      console.error('Failed to create blockchain API client:', error)
      return null
    }
  }, [cluster])

  return (
    <BlockchainApiContext.Provider value={client}>
      {children}
    </BlockchainApiContext.Provider>
  )
}

export const useBlockchainApi = (): APIRouter => {
  const context = useContext(BlockchainApiContext)

  if (!context) {
    throw new Error(
      'useBlockchainApi must be used within a BlockchainApiProvider. Make sure DEVNET_HELIUM_TRANSACTION_API or MAINNET_HELIUM_TRANSACTION_API is set in your .env file.',
    )
  }

  return context
}
