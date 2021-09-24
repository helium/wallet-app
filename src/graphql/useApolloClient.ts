import Config from 'react-native-config'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { AsyncStorageWrapper, persistCache } from 'apollo3-cache-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAsync } from 'react-async-hook'
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

export const useApolloClient = () => {
  const { result: client, loading } = useAsync(async () => {
    await persistCache({
      cache,
      storage: new AsyncStorageWrapper(AsyncStorage),
    })
    return new ApolloClient({
      uri: Config.GRAPH_URI,
      cache,
    })
  }, [])

  return {
    client,
    loading,
  }
}
