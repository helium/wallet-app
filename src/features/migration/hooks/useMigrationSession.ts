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
    AsyncStorage.getItem(keyFor(sourceWallet)).then((raw) => {
      setResume(deriveResume(deserializeSession(raw)))
    })
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
