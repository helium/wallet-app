import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Intervals } from '../features/settings/useAuthIntervals'
import { getSecureItem, storeSecureItem } from './secureStorage'

const VOTE_TUTORIAL_SHOWN = 'voteTutorialShown'

const useAppStorageHook = () => {
  const [pin, setPin] = useState<{
    value: string
    status: 'on' | 'restored' | 'off'
  }>()
  const [requirePinForPayment, setRequirePinForPayment] =
    useState<boolean>(false)
  const [authInterval, setAuthInterval] = useState<Intervals>(
    Intervals.IMMEDIATELY,
  )
  const [currency, setCurrency] = useState('USD')
  const [locked, setLocked] = useState<boolean>()
  const [convertToCurrency, setConvertToCurrency] = useState(false)
  const [enableTestnet, setEnableTestnet] = useState(false)
  const [enableSolana, setEnableSolana] = useState(false)
  const [scannedAddress, setScannedAddress] = useState<string>()
  const [voteTutorialShown, setVoteTutorialShown] = useState(false)
  const [showNumericChange, setShowNumericChange] = useState(false)

  useAsync(async () => {
    // TODO: When performing an account restore pin will not be restored.
    // Find a way to detect when a restore happens and prompt user for a new pin
    try {
      const nextPin = await getSecureItem('pin')
      const nextPinForPayment = await getSecureItem('pinForPayment')
      const nextAuthInterval = await getSecureItem('authInterval')
      const nextLocked = await getSecureItem('locked')
      const nextCurrency = await getSecureItem('currency')
      const nextConvertToCurrency = await getSecureItem('convertToCurrency')
      const nextEnableTestnet = await getSecureItem('enableTestnet')
      const nextEnableSolana = await getSecureItem('enableSolana')
      const nextVoteShown = await AsyncStorage.getItem(VOTE_TUTORIAL_SHOWN)
      const nextShowNumericChange = await getSecureItem('showNumericChange')

      setPin({ value: nextPin || '', status: nextPin ? 'restored' : 'off' })
      setRequirePinForPayment(nextPinForPayment === 'true')

      // Always lock when app is freshly started
      if (nextPin) {
        if (locked === undefined) {
          setLocked(true)
        } else {
          setLocked(nextLocked === 'true')
        }
      } else {
        setLocked(false)
      }

      setCurrency(nextCurrency || 'USD')
      setConvertToCurrency(nextConvertToCurrency === 'true')
      setEnableTestnet(nextEnableTestnet === 'true')
      setEnableSolana(nextEnableSolana === 'true')
      setVoteTutorialShown(nextVoteShown === 'true')
      setShowNumericChange(nextShowNumericChange === 'true')

      if (nextAuthInterval) {
        setAuthInterval(Number.parseInt(nextAuthInterval, 10))
      }
    } catch (e) {
      console.error(e)
      setPin({ value: '', status: 'off' })
    }
  }, [])

  const updatePin = useCallback(async (nextPin: string) => {
    setPin({ value: nextPin, status: nextPin ? 'on' : 'off' })
    return storeSecureItem('pin', nextPin)
  }, [])

  const updateLocked = useCallback(async (shouldLock: boolean) => {
    setLocked(shouldLock)
    return storeSecureItem('locked', shouldLock ? 'true' : 'false')
  }, [])

  const updateRequirePinForPayment = useCallback(
    async (pinRequired: boolean) => {
      setRequirePinForPayment(pinRequired)
      return storeSecureItem('pinForPayment', pinRequired ? 'true' : 'false')
    },
    [],
  )

  const updateAuthInterval = useCallback(async (interval: Intervals) => {
    setAuthInterval(interval)
    return storeSecureItem('authInterval', interval.toString())
  }, [])

  const updateCurrency = useCallback(async (nextCurrency: string) => {
    setCurrency(nextCurrency)
    return storeSecureItem('currency', nextCurrency)
  }, [])

  const updateConvertToCurrency = useCallback(
    async (nextConvertToCurrency: boolean) => {
      setConvertToCurrency(nextConvertToCurrency)
      return storeSecureItem(
        'convertToCurrency',
        nextConvertToCurrency ? 'true' : 'false',
      )
    },
    [],
  )

  const updateEnableTestnet = useCallback(
    async (nextEnableTestnet: boolean) => {
      setEnableTestnet(nextEnableTestnet)
      return storeSecureItem(
        'enableTestnet',
        nextEnableTestnet ? 'true' : 'false',
      )
    },
    [],
  )

  const updateEnableSolana = useCallback(async (nextEnableSolana: boolean) => {
    setEnableSolana(nextEnableSolana)
    return storeSecureItem('enableSolana', nextEnableSolana ? 'true' : 'false')
  }, [])

  const toggleConvertToCurrency = useCallback(async () => {
    setConvertToCurrency((prev) => {
      storeSecureItem('convertToCurrency', !prev ? 'true' : 'false')
      return !prev
    })
  }, [])

  const setVoteTutorialCompleted = useCallback(() => {
    setVoteTutorialShown(true)
    return AsyncStorage.setItem(VOTE_TUTORIAL_SHOWN, 'true')
  }, [])

  const updateShowNumericChange = useCallback(async (useNumeric: boolean) => {
    setShowNumericChange(useNumeric)
    return storeSecureItem('showNumericChange', useNumeric ? 'true' : 'false')
  }, [])

  return {
    authInterval,
    convertToCurrency,
    currency,
    enableSolana,
    enableTestnet,
    locked,
    pin,
    scannedAddress,
    setScannedAddress,
    setVoteTutorialCompleted,
    requirePinForPayment,
    toggleConvertToCurrency,
    updateAuthInterval,
    updateConvertToCurrency,
    updateCurrency,
    updateEnableSolana,
    updateEnableTestnet,
    updateLocked,
    updatePin,
    updateRequirePinForPayment,
    voteTutorialShown,
    showNumericChange,
    updateShowNumericChange,
  }
}

const initialState = {
  authInterval: Intervals.IMMEDIATELY,
  convertToCurrency: false,
  currency: 'USD',
  enableSolana: false,
  enableTestnet: false,
  locked: false,
  pin: undefined,
  requirePinForPayment: false,
  scannedAddress: undefined,
  setScannedAddress: () => undefined,
  setVoteTutorialCompleted: () => new Promise<void>((resolve) => resolve()),
  toggleConvertToCurrency: async () => undefined,
  updateAuthInterval: async () => undefined,
  updateConvertToCurrency: async () => undefined,
  updateCurrency: async () => undefined,
  updateEnableSolana: async () => undefined,
  updateEnableTestnet: async () => undefined,
  updateLocked: async () => undefined,
  updatePin: async () => undefined,
  updateRequirePinForPayment: async () => undefined,
  voteTutorialShown: false,
  updateShowNumericChange: async () => undefined,
  showNumericChange: false,
}

const AppStorageContext =
  createContext<ReturnType<typeof useAppStorageHook>>(initialState)
const { Provider } = AppStorageContext

const AppStorageProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useAppStorageHook()}>{children}</Provider>
}

export const useAppStorage = () => useContext(AppStorageContext)

export default AppStorageProvider
