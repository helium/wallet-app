import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'
import { useAsync } from 'react-async-hook'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Cluster, PublicKey } from '@solana/web3.js'
import { Intervals } from '../features/settings/useAuthIntervals'
import {
  getSecureItem,
  SecureStorageKeys,
  storeSecureItem,
} from './secureStorage'

const VOTE_TUTORIAL_SHOWN = 'voteTutorialShown'
const DAPP_TUTORIAL_SHOWN = 'dAppTutorialShown'

const useAppStorageHook = () => {
  const [autoGasManagementToken, setAutoGasManagementToken] = useState<
    PublicKey | undefined
  >(undefined)
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
  const [explorer, setExplorer] = useState<string | undefined>(undefined)
  const [enableHaptic, setEnableHaptic] = useState<boolean | undefined>(
    undefined,
  )
  const [locked, setLocked] = useState<boolean>()
  const [convertToCurrency, setConvertToCurrency] = useState(false)
  const [enableTestnet, setEnableTestnet] = useState(false)
  const [scannedAddress, setScannedAddress] = useState<string>()
  const [dAppTutorialShown, setDAppTutorialShown] = useState<
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
  const [manualMigration, setManualMigration] = useState<
    Record<Cluster, string[]>
  >({
    devnet: [],
    testnet: [],
    'mainnet-beta': [],
  })

  const [sessionKey, setSessionKey] = useState('')

  useAsync(async () => {
    // TODO: When performing an account restore pin will not be restored.
    // Find a way to detect when a restore happens and prompt user for a new pin
    try {
      const nextAutoGasManagementToken = await getSecureItem(
        'autoGasManagementToken',
      )
      const nextPin = await getSecureItem('pin')
      const nextPinForPayment = await getSecureItem('pinForPayment')
      const nextAuthInterval = await getSecureItem('authInterval')
      const nextLocked = await getSecureItem('locked')
      const nextCurrency = await getSecureItem('currency')
      const nextConvertToCurrency = await getSecureItem('convertToCurrency')
      const nextEnableTestnet = await getSecureItem('enableTestnet')
      const nextEnableHaptic = await getSecureItem('enableHaptic')
      const nextExplorer = await getSecureItem('explorer')
      const nextDAppShown = await AsyncStorage.getItem(DAPP_TUTORIAL_SHOWN)
      const nextVoteShown = await AsyncStorage.getItem(VOTE_TUTORIAL_SHOWN)
      const nextShowNumericChange = await getSecureItem('showNumericChange')
      const nextDoneSolanaMigration = await getSecureItem(
        SecureStorageKeys.DONE_SOLANA_MIGRATION,
      )
      const nextSessionKey = await getSecureItem(SecureStorageKeys.SESSION_KEY)

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

      setAutoGasManagementToken(
        nextAutoGasManagementToken
          ? new PublicKey(nextAutoGasManagementToken)
          : undefined,
      )
      setCurrency(nextCurrency || 'USD')
      setConvertToCurrency(nextConvertToCurrency === 'true')
      setExplorer(nextExplorer || undefined)
      setEnableHaptic(nextEnableHaptic === 'true')
      setEnableTestnet(nextEnableTestnet === 'true')
      setDAppTutorialShown(
        JSON.parse(nextDAppShown || '{}') as Record<string, boolean>,
      )
      setVoteTutorialShown(nextVoteShown === 'true')
      setShowNumericChange(nextShowNumericChange === 'true')
      setSessionKey(nextSessionKey || '')
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

  const updateAutoGasManagementToken = useCallback(
    async (nextToken: PublicKey | undefined) => {
      setAutoGasManagementToken(nextToken)
      return storeSecureItem(
        'autoGasManagementToken',
        nextToken ? nextToken.toBase58() : '',
      )
    },
    [],
  )

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

  const updateExplorer = useCallback(async (nextExplorer: string) => {
    setExplorer(nextExplorer)
    return storeSecureItem('explorer', nextExplorer)
  }, [])

  const updateEnableHaptic = useCallback(async (nextEnableHaptic: boolean) => {
    setEnableHaptic(nextEnableHaptic)
    return storeSecureItem('enableHaptic', nextEnableHaptic ? 'true' : 'false')
  }, [])
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

  const setDAppTutorialCompleted = useCallback(
    (cluster: Cluster) => {
      const newState = {
        ...dAppTutorialShown,
        [cluster]: true,
      }
      setDAppTutorialShown(newState)
      return AsyncStorage.setItem(DAPP_TUTORIAL_SHOWN, JSON.stringify(newState))
    },
    [dAppTutorialShown],
  )

  const setVoteTutorialCompleted = useCallback(() => {
    setVoteTutorialShown(true)
    return AsyncStorage.setItem(VOTE_TUTORIAL_SHOWN, 'true')
  }, [])

  const updateShowNumericChange = useCallback(async (useNumeric: boolean) => {
    setShowNumericChange(useNumeric)
    return storeSecureItem('showNumericChange', useNumeric ? 'true' : 'false')
  }, [])

  const updateSessionKey = useCallback(
    async ({ sessionKey: newSessionKey }: { sessionKey: string }) => {
      setSessionKey(newSessionKey)
      return storeSecureItem(SecureStorageKeys.SESSION_KEY, newSessionKey)
    },
    [],
  )

  const updateDoneSolanaMigration = useCallback(
    async ({ cluster, address }: { cluster: Cluster; address: string }) => {
      const newState = {
        ...doneSolanaMigration,
        [cluster]: [...(doneSolanaMigration[cluster] || []), address],
      }
      setDoneSolanaMigration(newState)
      return storeSecureItem(
        SecureStorageKeys.DONE_SOLANA_MIGRATION,
        JSON.stringify(newState),
      )
    },
    [doneSolanaMigration],
  )

  const updateManualMigration = useCallback(
    async ({ cluster, address }: { cluster: Cluster; address: string }) => {
      const newState = {
        ...manualMigration,
        [cluster]: [...(manualMigration[cluster] || []), address],
      }
      setManualMigration(newState)
      return storeSecureItem(
        SecureStorageKeys.MANUAL_SOLANA_MIGRATION,
        JSON.stringify(newState),
      )
    },
    [manualMigration],
  )

  return {
    autoGasManagementToken,
    updateAutoGasManagementToken,
    authInterval,
    convertToCurrency,
    currency,
    explorer,
    enableTestnet,
    locked,
    enableHaptic,
    updateEnableHaptic,
    pin,
    requirePinForPayment,
    scannedAddress,
    setScannedAddress,
    setVoteTutorialCompleted,
    setDAppTutorialCompleted,
    showNumericChange,
    sessionKey,
    doneSolanaMigration,
    updateDoneSolanaMigration,
    manualMigration,
    updateManualMigration,
    updateSessionKey,
    updateAuthInterval,
    updateCurrency,
    updateExplorer,
    updateEnableTestnet,
    updateLocked,
    updatePin,
    updateRequirePinForPayment,
    updateShowNumericChange,
    voteTutorialShown,
    dAppTutorialShown,
  }
}

const initialState = {
  autoGasManagementToken: undefined,
  authInterval: Intervals.IMMEDIATELY,
  convertToCurrency: false,
  enableHaptic: false,
  currency: 'USD',
  explorer: undefined,
  enableTestnet: false,
  locked: false,
  pin: undefined,
  requirePinForPayment: false,
  scannedAddress: undefined,
  setScannedAddress: () => undefined,
  setDAppTutorialCompleted: async () => undefined,
  setVoteTutorialCompleted: () => new Promise<void>((resolve) => resolve()),
  updateEnableHaptic: async () => undefined,
  updateAutoGasManagementToken: async () => undefined,
  updateAuthInterval: async () => undefined,
  updateCurrency: async () => undefined,
  updateExplorer: async () => undefined,
  updateEnableTestnet: async () => undefined,
  updateLocked: async () => undefined,
  updatePin: async () => undefined,
  updateRequirePinForPayment: async () => undefined,
  voteTutorialShown: false,
  updateShowNumericChange: async () => undefined,
  showNumericChange: false,
  updateDoneSolanaMigration: async () => undefined,
  updateManualMigration: async () => undefined,
  // Set of wallet addresses that have been migrated to Solana
  manualMigration: {
    devnet: [],
    testnet: [],
    'mainnet-beta': [],
  },
  doneSolanaMigration: {
    devnet: [],
    testnet: [],
    'mainnet-beta': [],
  },
  sessionKey: '',
  updateSessionKey: async () => undefined,
  dAppTutorialShown: {
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
