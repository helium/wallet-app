import { NetTypes as NetType } from '@helium/address'
import OnboardingClient, { Maker } from '@helium/onboarding'
import { ResolvedPath } from '@hooks/useDerivationAccounts'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { CSAccount } from '../../storage/cloudStorage'

type OnboardingData = {
  account?: CSAccount
  words?: string[]
  netType: NetType.NetType
  paths: ResolvedPath[]
}

const useOnboardingHook = ({ baseUrl }: { baseUrl: string }) => {
  const initialState = useMemo(() => {
    return {
      words: [],
      netType: NetType.MAINNET,
      paths: [],
    } as OnboardingData
  }, [])
  const [onboardingData, setOnboardingData] =
    useState<OnboardingData>(initialState)

  const [makers, setMakers] = useState<Maker[]>([])

  const reset = useCallback(() => {
    setOnboardingData(initialState)
  }, [initialState])

  useEffect(() => {
    new OnboardingClient(`${baseUrl}/v3`)
      .getMakers()
      .then(({ data }) => setMakers(data || []))
  }, [baseUrl])

  return {
    onboardingData,
    setOnboardingData,
    reset,
    makers,
  }
}

const initialState = {
  makers: [] as Maker[],
  onboardingData: {
    words: [] as string[],
    netType: NetType.MAINNET,
    paths: [] as ResolvedPath[],
  },
  reset: () => undefined,
  setNetType: () => undefined,
  setOnboardingData: () => undefined,
}

const OnboardingContext =
  createContext<ReturnType<typeof useOnboardingHook>>(initialState)
const { Provider } = OnboardingContext

const OnboardingProvider = ({
  children,
  baseUrl,
}: {
  children: ReactNode
  baseUrl: string
}) => {
  return <Provider value={useOnboardingHook({ baseUrl })}>{children}</Provider>
}

export const useOnboarding = () => useContext(OnboardingContext)

export default OnboardingProvider
