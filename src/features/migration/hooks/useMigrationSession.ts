import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import {
  deriveResume,
  deserializeSession,
  MigrationSession,
  ResumeInfo,
  serializeSession,
} from '../logic/session'

const keyFor = (wallet: string) => `migrateToWorldSession:${wallet}`

const NO_RESUME: ResumeInfo = deriveResume(null)

export const useMigrationSession = (sourceWallet: string | undefined) => {
  const [resume, setResume] = useState<ResumeInfo>(NO_RESUME)
  // False until the initial AsyncStorage read resolves. Consumers gate on this
  // so an in-flight-session check can't lose a race against a UI timer.
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!sourceWallet) return undefined
    let cancelled = false
    setLoaded(false)
    AsyncStorage.getItem(keyFor(sourceWallet)).then((raw) => {
      if (!cancelled) {
        setResume(deriveResume(deserializeSession(raw)))
        setLoaded(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [sourceWallet])

  const persist = useCallback(
    async (session: MigrationSession) => {
      if (!sourceWallet) return
      await AsyncStorage.setItem(
        keyFor(sourceWallet),
        serializeSession(session),
      )
      // Keep the in-memory view live with what was just persisted so screens
      // read from `resume` alone — no shadow copy of the run's progress.
      setResume(deriveResume(session))
    },
    [sourceWallet],
  )

  const clear = useCallback(async () => {
    if (!sourceWallet) return
    await AsyncStorage.removeItem(keyFor(sourceWallet))
    setResume(NO_RESUME)
  }, [sourceWallet])

  return { persist, resume, clear, loaded }
}
