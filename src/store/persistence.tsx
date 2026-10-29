import { ReactNode } from 'react'
import { persistStore } from 'redux-persist'
import { create } from 'zustand'
import { importLegacyState } from '../storage/importLegacyState'
import store from './store'

// Rehydrate after the import settles, so the app mounts with its outcome known
export const persistor = persistStore(store, { manualPersist: true })

type LegacyImport =
  | { status: 'pending' }
  | { status: 'done' }
  | { status: 'failed'; error: unknown }

const useLegacyImport = create<LegacyImport>()(() => ({ status: 'pending' }))

const runLegacyImport = () =>
  importLegacyState().then(
    () => useLegacyImport.setState({ status: 'done' }, true),
    (error) => {
      console.error('Legacy state import failed', error)
      useLegacyImport.setState({ status: 'failed', error }, true)
    },
  )

// The Redux root persists under its own key, so a failed import leaves
// persist:root as it is for the retry
runLegacyImport().then(() => persistor.persist())

/**
 * Runs a failed import again. Call it before the error screen resets, so the
 * gate waits for the new run instead of showing the old failure.
 */
export const retryLegacyImport = () => {
  useLegacyImport.setState({ status: 'pending' }, true)
  runLegacyImport()
}

/**
 * Shows the app once the import is done. A failed import throws to the error
 * boundary, whose reset calls retryLegacyImport.
 */
export const LegacyImportGate = ({ children }: { children: ReactNode }) => {
  const legacyImport = useLegacyImport()
  switch (legacyImport.status) {
    case 'pending':
      return null
    case 'done':
      return children
    case 'failed':
      throw legacyImport.error
    default:
      return legacyImport satisfies never
  }
}
