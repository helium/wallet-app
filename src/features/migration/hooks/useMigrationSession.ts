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

const NO_RESUME: ResumeInfo = {
  canResume: false,
  input: null,
  movedCount: 0,
  failedCount: 0,
  status: 'idle',
}

export const useMigrationSession = (sourceWallet: string | undefined) => {
  const [resume, setResume] = useState<ResumeInfo>(NO_RESUME)

  useEffect(() => {
    if (!sourceWallet) return undefined
    let cancelled = false
    AsyncStorage.getItem(keyFor(sourceWallet)).then((raw) => {
      if (!cancelled) {
        setResume(deriveResume(deserializeSession(raw)))
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
    },
    [sourceWallet],
  )

  const clear = useCallback(async () => {
    if (!sourceWallet) return
    await AsyncStorage.removeItem(keyFor(sourceWallet))
    setResume(NO_RESUME)
  }, [sourceWallet])

  return { persist, resume, clear }
}
