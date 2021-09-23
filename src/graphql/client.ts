import { ApolloClient, InMemoryCache } from '@apollo/client'
import Config from 'react-native-config'
import { Account_accountActivity } from './__generated__/Account'

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        accountActivity: {
          keyArgs: ['address'],
          merge(existing, incoming) {
            const prev = existing as Account_accountActivity
            const next = incoming as Account_accountActivity
            const { cursor, data: nextData } = next
            const joined = [...(nextData || []), ...(prev?.data || [])].filter(
              (v, i, a) => a.findIndex((t) => t?.hash === v?.hash) === i, // filter dups
            )

            return { cursor, data: joined }
          },
        },
      },
    },
  },
})

const client = new ApolloClient({
  uri: Config.GRAPH_URI,
  cache,
})

export default client
