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
  const [currency, setCurrency] = useState('USD')
  const [locked, setLocked] = useState(false)
  const [convertToCurrency, setConvertToCurrency] = useState(false)
  const [enableTestnet, setEnableTestnet] = useState(false)

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

      setPin({ value: nextPin || '', status: nextPin ? 'restored' : 'off' })
      setRequirePinForPayment(nextPinForPayment === 'true')
      setLocked(nextLocked === 'true')
      setCurrency(nextCurrency || 'USD')
      setConvertToCurrency(nextConvertToCurrency === 'true')
      setEnableTestnet(nextEnableTestnet === 'true')

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

  const toggleConvertToCurrency = useCallback(async () => {
    setConvertToCurrency((prev) => {
      storeSecureItem('convertToCurrency', !prev ? 'true' : 'false')
      return !prev
    })
  }, [])

  return {
    authInterval,
    convertToCurrency,
    currency,
    enableTestnet,
    locked,
    pin,
    requirePinForPayment,
    toggleConvertToCurrency,
    updateAuthInterval,
    updateConvertToCurrency,
    updateCurrency,
    updateEnableTestnet,
    updateLocked,
    updatePin,
    updateRequirePinForPayment,
  }
}

const initialState = {
  authInterval: Intervals.IMMEDIATELY,
  convertToCurrency: false,
  currency: 'USD',
  enableTestnet: false,
  locked: false,
  pin: undefined,
  requirePinForPayment: false,
  toggleConvertToCurrency: async () => undefined,
  updateAuthInterval: async () => undefined,
  updateConvertToCurrency: async () => undefined,
  updateCurrency: async () => undefined,
  updateEnableTestnet: async () => undefined,
  updateLocked: async () => undefined,
  updatePin: async () => undefined,
  updateRequirePinForPayment: async () => undefined,
}

const AppStorageContext =
  createContext<ReturnType<typeof useAppStorageHook>>(initialState)
const { Provider } = AppStorageContext

const AppStorageProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useAppStorageHook()}>{children}</Provider>
}

export const useAppStorage = () => useContext(AppStorageContext)

export default AppStorageProvider
