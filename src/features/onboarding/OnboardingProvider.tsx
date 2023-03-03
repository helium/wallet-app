import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import OnboardingClient, { Maker } from '@helium/onboarding'
import { NetTypes as NetType } from '@helium/address'
import { CSAccount } from '../../storage/cloudStorage'
import { SecureAccount } from '../../storage/secureStorage'

type OnboardingData = {
  account?: CSAccount
  secureAccount?: SecureAccount
  words: string[]
  netType: NetType.NetType
}

const useOnboardingHook = ({ baseUrl }: { baseUrl: string }) => {
  const initialState = useMemo(() => {
    return {
      words: [],
      netType: NetType.MAINNET,
    } as OnboardingData
  }, [])
  const [onboardingData, setOnboardingData] =
    useState<OnboardingData>(initialState)

  const [makers, setMakers] = useState<Maker[]>([])

  const reset = useCallback(() => {
    setOnboardingData(initialState)
  }, [initialState])

  useEffect(() => {
    new OnboardingClient(baseUrl)
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
