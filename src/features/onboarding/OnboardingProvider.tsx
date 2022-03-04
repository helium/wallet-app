import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { NetType } from '@helium/crypto-react-native'
import OnboardingClient, { Maker } from '@helium/onboarding'
import { CSAccount } from '../../storage/cloudStorage'
import { SecureAccount } from '../../storage/secureStorage'

export type OnboardingOpt = 'import' | 'create' | 'assign'

type OnboardingData = {
  onboardingType: OnboardingOpt
  account?: CSAccount
  secureAccount?: SecureAccount
  words: string[]
  netType?: number
}

const useOnboardingHook = () => {
  const initialState = {
    onboardingType: 'import',
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

  return { onboardingData, setOnboardingData, reset, makers }
}

const initialState = {
  onboardingData: {
    onboardingType: 'import' as OnboardingOpt,
    words: [] as string[],
    netType: NetType.MAINNET,
  },
  makers: [] as Maker[],
  setOnboardingData: () => undefined,
  reset: () => undefined,
}

const OnboardingContext =
  createContext<ReturnType<typeof useOnboardingHook>>(initialState)
const { Provider } = OnboardingContext

const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useOnboardingHook()}>{children}</Provider>
}

export const useOnboarding = () => useContext(OnboardingContext)

export default OnboardingProvider
