import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { defaultShouldDehydrateQuery } from '@tanstack/react-query'
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client'
import { mmkv } from '../storage/mmkv'
import { PERSISTED_QUERY_MAX_AGE, PERSISTED_QUERY_ROOTS } from './queryClient'

export const QUERY_CACHE_KEY = 'queryCache'

// Bump when the data shape of a persisted query changes: restore drops a
// cache saved under another value.
const QUERY_CACHE_SCHEMA_VERSION = '1'

const isPersistedQueryKey = (queryKey: readonly unknown[]) =>
  PERSISTED_QUERY_ROOTS.some((root) => root === queryKey[0])

export const queryPersistOptions: PersistQueryClientProviderProps['persistOptions'] =
  {
    persister: createAsyncStoragePersister({
      storage: {
        getItem: (key) => mmkv.getString(key) ?? null,
        setItem: (key, value) => mmkv.set(key, value),
        removeItem: (key) => {
          mmkv.remove(key)
        },
      },
      key: QUERY_CACHE_KEY,
    }),
    buster: QUERY_CACHE_SCHEMA_VERSION,
    maxAge: PERSISTED_QUERY_MAX_AGE,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) &&
        isPersistedQueryKey(query.queryKey),
    },
  }
