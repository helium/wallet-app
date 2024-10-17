import { NetTypes as NetType } from '@helium/address'
import React, {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'

type KeystoneResolvedPath = {
  path: string
  publicKey: string
  masterFingerprint: string
  device: string
}

type KeystoneOnboardingData = {
  accounts: KeystoneResolvedPath[]
}

const useKeystoneOnboardingHook = () => {
  const initialState = useMemo(() => {
    return {
      accounts: [],
    } as KeystoneOnboardingData
  }, [])
  const [keystoneOnboardingData, setKeystoneOnboardingData] =
    useState<KeystoneOnboardingData>(initialState)

  return {
    keystoneOnboardingData,
    setKeystoneOnboardingData,
  }
}

const initialState = {
  keystoneOnboardingData: {
    netType: NetType.MAINNET,
    accounts: [] as KeystoneResolvedPath[],
  },
  setNetType: () => undefined,
  setKeystoneOnboardingData: () => undefined,
}

const KeystoneOnboardingContext =
  createContext<ReturnType<typeof useKeystoneOnboardingHook>>(initialState)

const KeystoneOnboardingProvider = ({ children }: { children: ReactNode }) => {
  return (
    <KeystoneOnboardingContext.Provider value={useKeystoneOnboardingHook()}>
      {children}
    </KeystoneOnboardingContext.Provider>
  )
}

export const useKeystoneOnboarding = () => useContext(KeystoneOnboardingContext)

export default KeystoneOnboardingProvider
