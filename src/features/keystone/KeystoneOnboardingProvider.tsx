import { NetTypes as NetType } from '@helium/address'
import OnboardingClient, { Maker } from '@helium/onboarding'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
  netType: NetType.NetType
  accounts: KeystoneResolvedPath[]
}

const useKeystoneOnboardingHook = ({ baseUrl }: { baseUrl: string }) => {
  const initialState = useMemo(() => {
    return {
      netType: NetType.MAINNET,
      accounts: [],
    } as KeystoneOnboardingData
  }, [])
  const [keystoneOnboardingData, setKeystoneOnboardingData] =
    useState<KeystoneOnboardingData>(initialState)

  const [makers, setMakers] = useState<Maker[]>([])

  const reset = useCallback(() => {
    setKeystoneOnboardingData(initialState)
  }, [initialState])

  useEffect(() => {
    new OnboardingClient(`${baseUrl}/v3`)
      .getMakers()
      .then(({ data }) => setMakers(data || []))
  }, [baseUrl])

  return {
    keystoneOnboardingData,
    setKeystoneOnboardingData,
    reset,
    makers,
  }
}

const initialState = {
  makers: [] as Maker[],
  keystoneOnboardingData: {
    netType: NetType.MAINNET,
    accounts: [] as KeystoneResolvedPath[],
  },
  reset: () => undefined,
  setNetType: () => undefined,
  setKeystoneOnboardingData: () => undefined,
}

const KeystoneOnboardingContext =
  createContext<ReturnType<typeof useKeystoneOnboardingHook>>(initialState)

const KeystoneOnboardingProvider = ({
  children,
  baseUrl,
}: {
  children: ReactNode
  baseUrl: string
}) => {
  return (
    <KeystoneOnboardingContext.Provider
      value={useKeystoneOnboardingHook({ baseUrl })}
    >
      {children}
    </KeystoneOnboardingContext.Provider>
  )
}

export const useKeystoneOnboarding = () => useContext(KeystoneOnboardingContext)

export default KeystoneOnboardingProvider
