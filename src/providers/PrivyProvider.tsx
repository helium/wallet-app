import React, { FC, ReactNode } from 'react'
import { PrivyProvider as PrivyProviderBase } from '@privy-io/expo'
import Config from 'react-native-config'

const PrivyAppProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const appId = Config.PRIVY_APP_ID
  const clientId = Config.PRIVY_CLIENT_ID

  if (!appId || !clientId) {
    console.warn('Privy app ID or client ID not configured')
    return <>{children}</>
  }

  return (
    <PrivyProviderBase appId={appId} clientId={clientId}>
      {children}
    </PrivyProviderBase>
  )
}

export default PrivyAppProvider
