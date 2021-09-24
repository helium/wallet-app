import React from 'react'
import { ApolloProvider } from '@apollo/client'
import { Text } from 'react-native'
import AccountInfo from './src/AccountInfo'
import { useApolloClient } from './src/graphql/useApolloClient'

const App = () => {
  const { client, loading: loadingClient } = useApolloClient()

  if (!client || loadingClient) {
    return <Text>Splash Screen</Text>
  }
  return (
    <ApolloProvider client={client}>
      <AccountInfo />
    </ApolloProvider>
  )
}

export default App
