import { Device, useHotspotBle } from '@helium/react-native-sdk'
import { useNavigation } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { Plus } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Platform, PermissionsAndroid, View } from 'react-native'
import {
  PERMISSIONS,
  PermissionStatus,
  RESULTS,
  check,
  request,
} from 'react-native-permissions'
import { withUniwind } from 'uniwind'
import * as Logger from '../../../utils/logger'
import OnboardingScreen from '../components/OnboardingScreen'
import type { HotspotBleNavProp } from './navTypes'
import { useIotBleOptions } from './optionsContext'

const PlusIcon = withUniwind(Plus)

// Every permission status other than granted blocks the scan
const isGranted = (result: PermissionStatus) => result === RESULTS.GRANTED

const ScanHotspots = () => {
  const { startScan, stopScan, connect, scannedDevices } = useHotspotBle()
  const [scanning, setScanning] = useState(false)
  const { bleInstructions } = useIotBleOptions()
  const [canScan, setCanScan] = useState<boolean | undefined>(
    Platform.OS === 'ios' ? true : undefined,
  )
  const navigation = useNavigation<HotspotBleNavProp>()
  const { t } = useTranslation()
  const [error, setError] = useState<string | undefined>(undefined)

  const showError = (e: unknown) => {
    Logger.error(e)
    setError(String(e))
  }

  useEffect(() => {
    if (Platform.OS === 'ios') return

    check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
      .then((result) => setCanScan(isGranted(result)))
      .catch(showError)
  }, [])

  useEffect(() => {
    if (canScan !== false) return

    request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION)
      .then((result) => setCanScan(isGranted(result)))
      .catch(showError)
  }, [canScan])

  const checkPermission = async () => {
    if (Platform.OS === 'ios') {
      return true
    }

    const perms = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]

    const results = await Promise.all(
      perms.map((p) => PermissionsAndroid.check(p)),
    )

    if (results.findIndex((r) => r === false) === -1) {
      return true
    }

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ])

    perms.forEach((p) => {
      if (!granted[p]) {
        return false
      }
    })

    return true
  }

  const handleScanPress = async () => {
    const shouldScan = !scanning
    setScanning(shouldScan)
    await checkPermission()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timeout: any | undefined
    if (shouldScan) {
      setError(undefined)
      timeout = setTimeout(() => {
        stopScan()
        setScanning(false)
        if (scannedDevices.length === 0) {
          setError(
            'No hotspots found. Please ensure bluetooth pairing is enabled',
          )
        }
      }, 30 * 1000)
    }

    if (shouldScan) {
      void startScan((e) => {
        if (e) {
          showError(e)
        }
      })
    } else {
      stopScan()
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout)
        stopScan()
      }
    }
  }

  const navNext = () => navigation.push('Settings')

  const [connecting, setConnecting] = useState(false)
  const connectDevice = (d: Device) => async () => {
    try {
      setConnecting(true)
      await connect(d)
      if (scanning) {
        stopScan()
        setScanning(false)
      }
      setConnecting(false)
      navNext()
    } catch (e) {
      // No finally clause: the React Compiler cannot compile one yet
      setConnecting(false)
      showError(e)
    }
  }

  const renderItem = ({ item }: { item: Device }) => {
    return (
      <PressableScale
        onPress={() => void connectDevice(item)().catch(console.error)}
        feedback="opacity"
        className="flex-row items-center border-y border-border p-4"
        disabled={connecting}
      >
        <View className="mr-3 size-5 items-center justify-center rounded-full bg-secondary">
          <PlusIcon size={12} colorClassName="accent-foreground" />
        </View>
        <Text size="base" className="font-medium text-muted-foreground">
          {item.name}
        </Text>
      </PressableScale>
    )
  }

  const keyExtractor = ({ id }: Device) => id

  return (
    <OnboardingScreen title={t('hotspotOnboarding.scan.title')}>
      <Text
        size="xl"
        className="my-4 text-left font-medium text-muted-foreground"
        adjustsFontSizeToFit
      >
        {bleInstructions || t('hotspotOnboarding.scan.subtitle')}
      </Text>
      {scannedDevices.length === 0 && scanning && <Spinner />}
      {scannedDevices.length === 0 && scanning && (
        <Text
          size="base"
          className="mt-2 text-center font-medium text-muted-foreground"
        >
          {t('hotspotOnboarding.scan.scanning')}
        </Text>
      )}

      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={scannedDevices}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
      {error && (
        <Text size="base" className="font-medium text-destructive">
          {error}
        </Text>
      )}
      <Button
        variant={scanning ? 'outline' : 'cta'}
        size="dashboard"
        className="mt-6 w-full"
        onPress={() => void handleScanPress().catch(console.error)}
        disabled={!canScan || connecting}
      >
        {canScan
          ? scanning
            ? t('hotspotOnboarding.scan.stop')
            : t('hotspotOnboarding.scan.start')
          : t('hotspotOnboarding.scan.notEnabled')}
      </Button>
    </OnboardingScreen>
  )
}

export default ScanHotspots
