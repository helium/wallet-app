import React from 'react'
import { ApolloProvider } from '@apollo/client'
import AccountInfo from './src/AccountInfo'
import client from './src/graphql/client'

const App = () => {
  return (
    <ApolloProvider client={client}>
      <AccountInfo />
    </ApolloProvider>
  )
}

export default App
