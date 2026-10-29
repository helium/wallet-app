import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { defaultShouldDehydrateQuery } from '@tanstack/react-query'
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client'
import { mmkvStateStorage } from '../storage/mmkv'
import { useCloudStore } from '../store/cloudStore'
import { PERSISTED_QUERY_MAX_AGE, PERSISTED_QUERY_ROOTS } from './queryClient'

export const QUERY_CACHE_KEY = 'queryCache'

// Bump when the data shape of a persisted query changes: restore drops a
// cache saved under another value.
const QUERY_CACHE_SCHEMA_VERSION = '1'

const isPersistedQueryKey = (queryKey: readonly unknown[]) =>
  PERSISTED_QUERY_ROOTS.some((root) => root === queryKey[0])

// Signed out, nothing is saved
const hasAccounts = () =>
  Object.keys(useCloudStore.getState().accounts ?? {}).length > 0

export const queryPersistOptions: PersistQueryClientProviderProps['persistOptions'] =
  {
    persister: createAsyncStoragePersister({
      storage: {
        getItem: mmkvStateStorage.getItem,
        // An empty client removes the key, so none stays on disk
        setItem: (key, value) =>
          value === ''
            ? mmkvStateStorage.removeItem(key)
            : mmkvStateStorage.setItem(key, value),
        removeItem: (key) => {
          mmkvStateStorage.removeItem(key)
        },
      },
      key: QUERY_CACHE_KEY,
      serialize: (client) =>
        client.clientState.queries.length === 0 &&
        client.clientState.mutations.length === 0
          ? ''
          : JSON.stringify(client),
    }),
    buster: QUERY_CACHE_SCHEMA_VERSION,
    maxAge: PERSISTED_QUERY_MAX_AGE,
    dehydrateOptions: {
      // Each save refreshes the cache timestamp, so maxAge alone never drops
      // old data: check the age of each query too
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) &&
        isPersistedQueryKey(query.queryKey) &&
        hasAccounts() &&
        Date.now() - query.state.dataUpdatedAt <= PERSISTED_QUERY_MAX_AGE,
    },
  }
