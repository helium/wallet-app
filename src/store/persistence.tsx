import { ReactNode } from 'react'
import { create } from 'zustand'
import { importLegacyState } from '../storage/importLegacyState'

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

// A failed import leaves persist:root as it is for the retry
void runLegacyImport()

/**
 * Runs a failed import again. Call it before the error screen resets, so the
 * gate waits for the new run instead of showing the old failure.
 */
export const retryLegacyImport = () => {
  useLegacyImport.setState({ status: 'pending' }, true)
  void runLegacyImport()
}

/**
 * The error boundary's reset: runs the import again, so the gate waits for
 * the new run instead of showing the old failure.
 */
export const resetAfterError = () => {
  retryLegacyImport()
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
