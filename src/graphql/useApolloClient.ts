import Config from 'react-native-config'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { AsyncStorageWrapper, persistCache } from 'apollo3-cache-persist'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAsync } from 'react-async-hook'
import { ActivityData, Activity } from '../generated/graphql'

type ActivityCache = {
  cursor: string
  data: Record<string, Activity>
}

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        accountActivity: {
          keyArgs: ['address'],
          merge(existing, incoming, { args }) {
            const { data: prevData } = (existing || {
              data: {},
              cursor: '',
            }) as ActivityCache

            const { cursor: nextCursor, data: incomingData } = (incoming || {
              data: [],
              cursor: '',
            }) as ActivityData

            const prevDataArr = Object.values(
              existing?.data || {},
            ) as Activity[]

            if (!args?.cursor && prevDataArr.length && incomingData?.length) {
              // There is no cursor and we have previously cached items
              // In this scenario we're just checking to see if any new rewards have been added
              const firstNewHash = incomingData[0].hash
              const firstOldHash = prevDataArr[0].hash

              if (firstNewHash !== firstOldHash) {
                // We have a new item, wipe out cache and replace with new items
                return {
                  cursor: nextCursor,
                  data: incomingData.reduce(
                    (obj, item) => ({ ...obj, [item.hash]: item }),
                    {},
                  ),
                }
              }
            }

            return {
              cursor: nextCursor,
              data:
                incomingData?.reduce(
                  (obj, item) => ({ ...obj, [item.hash]: item }),
                  prevData,
                ) || {},
            }
          },
          read(existing) {
            if (existing) {
              return {
                cursor: existing.cursor,
                data: Object.values(existing?.data || {}),
              }
            }
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
