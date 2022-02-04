import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import * as SecureStore from 'expo-secure-store'
import { Intervals } from '../features/settings/useAuthIntervals'

export enum SecureStorageKeys {
  PIN = 'pin',
  PIN_FOR_PAYMENT = 'pinForPayment',
  AUTH_INTERVAL = 'authInterval',
  LOCKED = 'locked',
  CURRENCY = 'currency',
  CONVERT_TO_CURRENCY = 'covertToCurrency',
  LAST_IDLE = 'lastIdle',
}

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
      const nextPin = await SecureStore.getItemAsync(SecureStorageKeys.PIN)
      const nextPinForPayment = await SecureStore.getItemAsync(
        SecureStorageKeys.PIN_FOR_PAYMENT,
      )
      const nextAuthInterval = await SecureStore.getItemAsync(
        SecureStorageKeys.AUTH_INTERVAL,
      )
      const nextLocked = await SecureStore.getItemAsync(
        SecureStorageKeys.LOCKED,
      )
      const nextCurrency = await SecureStore.getItemAsync(
        SecureStorageKeys.CURRENCY,
      )
      const nextConvertToCurrency = await SecureStore.getItemAsync(
        SecureStorageKeys.CONVERT_TO_CURRENCY,
      )

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
    return SecureStore.setItemAsync(SecureStorageKeys.PIN, nextPin)
  }, [])

  const updateLocked = useCallback(async (shouldLock: boolean) => {
    setLocked(shouldLock)
    return SecureStore.setItemAsync(
      SecureStorageKeys.LOCKED,
      shouldLock ? 'true' : 'false',
    )
  }, [])

  const updateRequirePinForPayment = useCallback(
    async (pinRequired: boolean) => {
      setRequirePinForPayment(pinRequired)
      return SecureStore.setItemAsync(
        SecureStorageKeys.PIN_FOR_PAYMENT,
        pinRequired ? 'true' : 'false',
      )
    },
    [],
  )

  const updateAuthInterval = useCallback(async (interval: Intervals) => {
    setAuthInterval(interval)
    return SecureStore.setItemAsync(
      SecureStorageKeys.AUTH_INTERVAL,
      interval.toString(),
    )
  }, [])

  const updateCurrency = useCallback(async (nextCurrency: string) => {
    setCurrency(nextCurrency)
    return SecureStore.setItemAsync(SecureStorageKeys.CURRENCY, nextCurrency)
  }, [])

  const updateConvertToCurrency = useCallback(
    async (nextConvertToCurrency: boolean) => {
      setConvertToCurrency(nextConvertToCurrency)
      return SecureStore.setItemAsync(
        SecureStorageKeys.CONVERT_TO_CURRENCY,
        nextConvertToCurrency ? 'true' : 'false',
      )
    },
    [],
  )

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
}

const AppStorageContext =
  createContext<ReturnType<typeof useAppStorageHook>>(initialState)
const { Provider } = AppStorageContext

const AppStorageProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useAppStorageHook()}>{children}</Provider>
}

export const useAppStorage = () => useContext(AppStorageContext)

export default AppStorageProvider
