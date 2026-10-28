import { persistStore } from 'redux-persist'
import { importLegacyState } from '../storage/importLegacyState'
import store from './store'

// Rehydrate only after the import, which removes the old persist:root keys
export const persistor = persistStore(store, { manualPersist: true })

importLegacyState()
  .catch((e) => console.error('Legacy state import failed', e))
  .finally(() => persistor.persist())
