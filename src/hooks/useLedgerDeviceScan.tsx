import type { DescriptorEvent } from '@ledgerhq/hw-transport'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { BlePlxManager } from '@ledgerhq/react-native-hw-transport-ble/lib/BlePlxManager'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import {
  check,
  Permission,
  PERMISSIONS,
  request,
  RESULTS,
} from 'react-native-permissions'
import type {
  Device,
  Subscription as BleSubscription,
} from 'react-native-ble-plx'
import * as Logger from '../utils/logger'

export type ScanErrorKind = 'permission' | 'bluetoothOff' | 'unknown'

type ScanError = { kind: ScanErrorKind; error: Error }

type ScanSubscription = ReturnType<typeof TransportBLE.listen>

// listen() never completes on its own, so stop scanning after this long.
const SCAN_TIMEOUT_MS = 15_000

const getBlePermissions = (): Permission[] => {
  if (Platform.OS === 'ios') {
    return [PERMISSIONS.IOS.BLUETOOTH]
  }
  if (Platform.OS !== 'android') {
    return []
  }
  // BLUETOOTH_SCAN / BLUETOOTH_CONNECT exist from Android 12 (API 31).
  // Older versions gate BLE scanning behind fine location instead.
  if (Number(Platform.Version) >= 31) {
    return [
      PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
      PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
    ]
  }
  return [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]
}

const checkPermission = async (): Promise<boolean> => {
  const permissions = getBlePermissions()

  // Sequential on purpose: the OS shows one permission dialog at a time.
  return permissions.reduce(async (previous, perm) => {
    if (!(await previous)) return false

    let result = await check(perm)
    if (result === RESULTS.DENIED) {
      result = await request(perm)
    }
    return result !== RESULTS.DENIED && result !== RESULTS.BLOCKED
  }, Promise.resolve(true))
}

const useDeviceScan = () => {
  const scanSub = useRef<ScanSubscription | undefined>(undefined)
  const stateSub = useRef<BleSubscription | undefined>(undefined)
  const scanTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [scanError, setScanError] = useState<ScanError>()
  const [devices, setDevices] = useState<Device[]>([])

  const setError = useCallback(
    (error?: Error, kind: ScanErrorKind = 'unknown') => {
      setScanError(error ? { error, kind } : undefined)
    },
    [],
  )

  const maybeAddDevice = useCallback((device: Device) => {
    setDevices((prev) =>
      prev.some((i) => i.id === device.id) ? prev : [...prev, device],
    )
  }, [])

  const stopScan = useCallback(() => {
    clearTimeout(scanTimer.current)
    scanTimer.current = undefined
    scanSub.current?.unsubscribe()
    scanSub.current = undefined
    setRefreshing(false)
  }, [])

  const startScan = useCallback(async () => {
    stopScan()
    setRefreshing(true)

    if (!(await checkPermission())) {
      setRefreshing(false)
      setError(new Error('Bluetooth permission not granted'), 'permission')
      return
    }

    // A concurrent startScan may have subscribed while we awaited permission
    scanSub.current?.unsubscribe()
    scanSub.current = TransportBLE.listen({
      complete: () => {
        setRefreshing(false)
      },
      next: (e: DescriptorEvent<Device>) => {
        if (e.type === 'add') {
          maybeAddDevice(e.descriptor)
        }
        setRefreshing(false)
      },
      error: (err) => {
        Logger.error(err)
        setError(err)
        stopScan()
      },
    })
    scanTimer.current = setTimeout(stopScan, SCAN_TIMEOUT_MS)
  }, [maybeAddDevice, setError, stopScan])

  useEffect(() => {
    let previousAvailable: boolean | undefined

    // TransportBLE.observeState's unsubscribe is a no-op, so subscribe to the
    // underlying manager directly to get a subscription we can remove.
    stateSub.current = BlePlxManager.onStateChange((state: string) => {
      if (state === 'Unknown' || state === 'Resetting') return

      const available = state === 'PoweredOn'
      const isInitialState = previousAvailable === undefined
      if (available === previousAvailable) return
      previousAvailable = available

      if (available) {
        setScanError((prev) =>
          prev?.kind === 'bluetoothOff' ? undefined : prev,
        )
        // The initial scan is started by the screen on focus
        if (!isInitialState) startScan()
        return
      }

      if (state === 'PoweredOff') {
        setError(new Error(state), 'bluetoothOff')
      } else if (state === 'Unauthorized') {
        setError(new Error(state), 'permission')
      } else {
        setError(new Error(state))
      }
    }, true)

    return () => {
      stateSub.current?.remove()
      stateSub.current = undefined
      stopScan()
    }
  }, [setError, startScan, stopScan])

  return {
    startScan,
    stopScan,
    refreshing,
    error: scanError?.error,
    errorKind: scanError?.kind,
    devices,
    setError,
    reload: startScan,
  }
}

export default useDeviceScan
