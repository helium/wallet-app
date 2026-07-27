import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deriveResume,
  deserializeSession,
  MigrationSession,
  ResumeInfo,
  serializeSession,
  stepForOutcome,
} from '../logic/session'

export type FlowStep =
  | 'intro'
  | 'connect'
  | 'login'
  | 'select'
  | 'review'
  | 'migrating'
  | 'pending'
  | 'partial'
  | 'success'
  | 'walletError'

const keyFor = (wallet: string) => `migrateToWorldSession:${wallet}`

const NO_RESUME: ResumeInfo = deriveResume(null)

// The persisted-session half: AsyncStorage read/write plus the derived resume
// info. Shared by the flow screen (via useMigrationSession) and the passive
// startup check (MigrateToWorldCheck), so resumable detection can't drift from
// what the flow actually resumes.
export const usePersistedMigrationResume = (
  sourceWallet: string | undefined,
) => {
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

  return { resume, loaded, persist, clear }
}

export const useMigrationSession = (sourceWallet: string | undefined) => {
  const { resume, loaded, persist, clear } =
    usePersistedMigrationResume(sourceWallet)
  const [step, setStep] = useState<FlowStep>('intro')

  const hasRoutedRef = useRef(false)
  // An interrupted session (app closed mid-migration) resumes straight to the
  // screen its persisted status maps to — the same mapping the live run uses,
  // so a batch-level failure lands on retry, not the "still processing" screen.
  // persist() now updates `resume` live, so canResume also flips true DURING a
  // run; routing off that would yank the user off the 'migrating' screen. Guard
  // it to the initial load: only route from 'intro' (a live run has already
  // moved past it) and latch it so it fires exactly once.
  useEffect(() => {
    if (hasRoutedRef.current) return
    if (resume.canResume && step === 'intro') {
      hasRoutedRef.current = true
      setStep(stepForOutcome(resume.status))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume.canResume])

  return { step, setStep, persist, resume, clear, loaded }
}
