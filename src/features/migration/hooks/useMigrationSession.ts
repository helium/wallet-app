import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import {
  deriveResume,
  deserializeSession,
  MigrateInput,
  MigrationSession,
  serializeSession,
} from '../logic/session'

export type FlowStep =
  | 'intro'
  | 'login'
  | 'select'
  | 'review'
  | 'migrating'
  | 'partial'
  | 'success'

const keyFor = (wallet: string) => `migrateToWorldSession:${wallet}`

export const useMigrationSession = (sourceWallet: string | undefined) => {
  const [step, setStep] = useState<FlowStep>('intro')
  const [resume, setResume] = useState<{
    canResume: boolean
    input: MigrateInput | null
  }>({
    canResume: false,
    input: null,
  })

  useEffect(() => {
    if (!sourceWallet) return
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
    setResume({ canResume: false, input: null })
  }, [sourceWallet])

  return { step, setStep, persist, resume, clear }
}
