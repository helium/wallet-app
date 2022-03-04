import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import { Intervals } from '../features/settings/useAuthIntervals'
import { getSecureItem, storeSecureItem } from './secureStorage'

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
  const [locked, setLocked] = useState<boolean>(false)
  const [currency, setCurrency] = useState<string>('USD')
  const [convertToCurrency, setConvertToCurrency] = useState<boolean>(false)

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

      setPin({ value: nextPin || '', status: nextPin ? 'restored' : 'off' })
      setRequirePinForPayment(nextPinForPayment === 'true')
      setLocked(nextLocked === 'true')
      setCurrency(nextCurrency || 'USD')
      setConvertToCurrency(nextConvertToCurrency === 'true')
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

  const toggleConvertToCurrency = useCallback(async () => {
    setConvertToCurrency((prev) => {
      storeSecureItem('convertToCurrency', !prev ? 'true' : 'false')
      return !prev
    })
  }, [])

  return {
    pin,
    updatePin,
    requirePinForPayment,
    updateRequirePinForPayment,
    authInterval,
    updateAuthInterval,
    locked,
    updateLocked,
    currency,
    updateCurrency,
    convertToCurrency,
    updateConvertToCurrency,
    toggleConvertToCurrency,
  }
}

const initialState = {
  pin: undefined,
  updatePin: async () => undefined,
  requirePinForPayment: false,
  updateRequirePinForPayment: async () => undefined,
  authInterval: Intervals.IMMEDIATELY,
  updateAuthInterval: async () => undefined,
  locked: false,
  updateLocked: async () => undefined,
  currency: 'USD',
  updateCurrency: async () => undefined,
  convertToCurrency: false,
  updateConvertToCurrency: async () => undefined,
  toggleConvertToCurrency: async () => undefined,
}

const AppStorageContext =
  createContext<ReturnType<typeof useAppStorageHook>>(initialState)
const { Provider } = AppStorageContext

const AppStorageProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useAppStorageHook()}>{children}</Provider>
}

export const useAppStorage = () => useContext(AppStorageContext)

export default AppStorageProvider
