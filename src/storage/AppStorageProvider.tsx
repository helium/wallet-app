import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Cluster } from '@solana/web3.js'
import { Intervals } from '../features/settings/useAuthIntervals'
import { getSecureItem, storeSecureItem } from './secureStorage'
import { L1Network } from '../utils/accountUtils'

const VOTE_TUTORIAL_SHOWN = 'voteTutorialShown'
const DEFI_TUTORIAL_SHOWN = 'defiTutorialShown'

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
  const [solanaNetwork, setSolanaNetwork] = useState<Cluster>('devnet')
  const [l1Network, setL1Network] = useState<L1Network>('helium')
  const [scannedAddress, setScannedAddress] = useState<string>()
  const [defiTutorialShown, setDefiTutorialShown] = useState<
    Record<Cluster, boolean>
  >({
    devnet: false,
    testnet: false,
    'mainnet-beta': false,
  })
  const [voteTutorialShown, setVoteTutorialShown] = useState(false)
  const [showNumericChange, setShowNumericChange] = useState(false)
  const [doneSolanaMigration, setDoneSolanaMigration] = useState<
    Record<Cluster, string[]>
  >({
    devnet: [],
    testnet: [],
    'mainnet-beta': [],
  })

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
      const nextSolanaNetwork = (await getSecureItem(
        'solanaNetwork',
      )) as Cluster | null
      const nextL1Network = (await getSecureItem(
        'l1Network',
      )) as L1Network | null
      const nextDefiShown = await AsyncStorage.getItem(DEFI_TUTORIAL_SHOWN)
      const nextVoteShown = await AsyncStorage.getItem(VOTE_TUTORIAL_SHOWN)
      const nextShowNumericChange = await getSecureItem('showNumericChange')
      const nextDoneSolanaMigration = await getSecureItem('doneSolanaMigration')

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
      setSolanaNetwork(nextSolanaNetwork || 'devnet')
      setL1Network(nextL1Network || 'helium')
      setDefiTutorialShown(
        JSON.parse(nextDefiShown || '{}') as Record<string, boolean>,
      )
      setVoteTutorialShown(nextVoteShown === 'true')
      setShowNumericChange(nextShowNumericChange === 'true')
      setDoneSolanaMigration(
        JSON.parse(nextDoneSolanaMigration || '{}') as Record<string, string[]>,
      )

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

  const updateL1Network = useCallback(async (nextL1Network: L1Network) => {
    setL1Network(nextL1Network)
    return storeSecureItem('l1Network', nextL1Network)
  }, [])

  const updateSolanaNetwork = useCallback(async (nextSolNetwork: Cluster) => {
    setSolanaNetwork(nextSolNetwork)
    return storeSecureItem('solanaNetwork', nextSolNetwork)
  }, [])

  const toggleConvertToCurrency = useCallback(async () => {
    setConvertToCurrency((prev) => {
      storeSecureItem('convertToCurrency', !prev ? 'true' : 'false')
      return !prev
    })
  }, [])

  const setDeFiTutorialCompleted = useCallback(
    (cluster: Cluster) => {
      const newState = {
        ...defiTutorialShown,
        [cluster]: true,
      }
      setDefiTutorialShown(newState)
      return AsyncStorage.setItem(DEFI_TUTORIAL_SHOWN, JSON.stringify(newState))
    },
    [defiTutorialShown],
  )

  const setVoteTutorialCompleted = useCallback(() => {
    setVoteTutorialShown(true)
    return AsyncStorage.setItem(VOTE_TUTORIAL_SHOWN, 'true')
  }, [])

  const updateShowNumericChange = useCallback(async (useNumeric: boolean) => {
    setShowNumericChange(useNumeric)
    return storeSecureItem('showNumericChange', useNumeric ? 'true' : 'false')
  }, [])

  const updateDoneSolanaMigration = useCallback(
    async ({ cluster, address }: { cluster: Cluster; address: string }) => {
      const newState = {
        ...doneSolanaMigration,
        [cluster]: [...(doneSolanaMigration[cluster] || []), address],
      }
      setDoneSolanaMigration(newState)
      return storeSecureItem('doneSolanaMigration', JSON.stringify(newState))
    },
    [doneSolanaMigration],
  )

  return {
    authInterval,
    convertToCurrency,
    currency,
    enableTestnet,
    l1Network,
    locked,
    pin,
    requirePinForPayment,
    scannedAddress,
    setScannedAddress,
    setVoteTutorialCompleted,
    setDeFiTutorialCompleted,
    showNumericChange,
    solanaNetwork,
    toggleConvertToCurrency,
    doneSolanaMigration,
    updateDoneSolanaMigration,
    updateAuthInterval,
    updateConvertToCurrency,
    updateCurrency,
    updateEnableTestnet,
    updateL1Network,
    updateLocked,
    updatePin,
    updateRequirePinForPayment,
    updateShowNumericChange,
    updateSolanaNetwork,
    voteTutorialShown,
    defiTutorialShown,
  }
}

const initialState = {
  authInterval: Intervals.IMMEDIATELY,
  convertToCurrency: false,
  currency: 'USD',
  enableTestnet: false,
  l1Network: 'helium' as L1Network,
  locked: false,
  pin: undefined,
  requirePinForPayment: false,
  scannedAddress: undefined,
  setScannedAddress: () => undefined,
  setDeFiTutorialCompleted: async () => undefined,
  setVoteTutorialCompleted: () => new Promise<void>((resolve) => resolve()),
  solanaNetwork: 'devnet' as Cluster,
  toggleConvertToCurrency: async () => undefined,
  updateAuthInterval: async () => undefined,
  updateConvertToCurrency: async () => undefined,
  updateCurrency: async () => undefined,
  updateEnableTestnet: async () => undefined,
  updateL1Network: async () => undefined,
  updateLocked: async () => undefined,
  updatePin: async () => undefined,
  updateRequirePinForPayment: async () => undefined,
  updateSolanaNetwork: async () => undefined,
  voteTutorialShown: false,
  updateShowNumericChange: async () => undefined,
  showNumericChange: false,
  updateDoneSolanaMigration: async () => undefined,
  // Set of wallet addresses that have been migrated to Solana
  doneSolanaMigration: {
    devnet: [],
    testnet: [],
    'mainnet-beta': [],
  },
  defiTutorialShown: {
    devnet: false,
    testnet: false,
    'mainnet-beta': false,
  },
}

const AppStorageContext =
  createContext<ReturnType<typeof useAppStorageHook>>(initialState)
const { Provider } = AppStorageContext

const AppStorageProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useAppStorageHook()}>{children}</Provider>
}

export const useAppStorage = () => useContext(AppStorageContext)

export default AppStorageProvider
