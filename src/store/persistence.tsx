import { persistStore } from 'redux-persist'
import { importLegacyState } from '../storage/importLegacyState'
import store from './store'

// Rehydrate only after the import, which removes the old persist:root key
export const persistor = persistStore(store, { manualPersist: true })

// After a failed import, keep persist:root as it is for the next launch's
// retry: rehydrating would rewrite it without the imported slices.
importLegacyState().then(
  () => persistor.persist(),
  (e) => console.error('Legacy state import failed', e),
)
