import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import OnboardingClient, { Maker } from '@helium/onboarding'
import { NetType } from '@helium/crypto-react-native'
import { CSAccount } from '../../storage/cloudStorage'
import { SecureAccount } from '../../storage/secureStorage'

type OnboardingData = {
  account?: CSAccount
  secureAccount?: SecureAccount
  words: string[]
  netType: NetType.NetType
}

const useOnboardingHook = () => {
  const initialState = {
    words: [],
    netType: NetType.MAINNET,
  } as OnboardingData
  const [onboardingData, setOnboardingData] =
    useState<OnboardingData>(initialState)

  const [makers, setMakers] = useState<Maker[]>([])

  const reset = useCallback(() => {
    setOnboardingData(initialState)
  }, [initialState])

  useEffect(() => {
    new OnboardingClient().getMakers().then(({ data }) => setMakers(data || []))
  }, [])

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

const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useOnboardingHook()}>{children}</Provider>
}

export const useOnboarding = () => useContext(OnboardingContext)

export default OnboardingProvider
