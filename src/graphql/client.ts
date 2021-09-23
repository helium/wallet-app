import { ApolloClient, InMemoryCache } from '@apollo/client'
import Config from 'react-native-config'
import { AccountData_accountActivity } from './__generated__/AccountData'

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        accountActivity: {
          keyArgs: ['address'],
          merge(existing, incoming) {
            const prev = existing as AccountData_accountActivity
            const next = incoming as AccountData_accountActivity
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
