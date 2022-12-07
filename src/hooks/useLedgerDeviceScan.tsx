import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { useCallback, useState, useRef } from 'react'
import { Observable, Subscription } from 'rxjs'
import { PermissionsAndroid, Platform } from 'react-native'
import { Device } from 'react-native-ble-plx'
import { useAsync } from 'react-async-hook'
import * as Logger from '../utils/logger'

enum DeviceModelId {
  blue = 'blue',
  nanoS = 'nanoS',
  nanoSP = 'nanoSP',
  nanoX = 'nanoX',
}

type LedgerDetails = {
  type: string
  descriptor: Device
  deviceModel: {
    id: DeviceModelId
    productName: string
    productIdMM: number
    legacyUsbProductId: number
    usbOnly: boolean
    memorySize: number
    masks: number[]
    // blockSize: number, // THIS FIELD IS DEPRECATED, use getBlockSize
    getBlockSize: (firmwareVersion: string) => number
    bluetoothSpec?: {
      serviceUuid: string
      writeUuid: string
      writeCmdUuid: string
      notifyUuid: string
    }[]
  }
}

type LedgerAvailable = {
  available: boolean
  type: string
}

const checkPermission = async () => {
  if (Platform.OS === 'ios') {
    return true
  }

  const perms = [
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
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
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
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

const useDeviceScan = () => {
  const sub = useRef<Subscription>()
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<Error>()
  const [devices, setDevices] = useState<Device[]>([])

  const maybeAddDevice = useCallback(
    (device: Device) => {
      if (devices.some((i: Device) => i.id === device.id)) {
        return
      }

      setDevices([...devices, device])
    },
    [devices],
  )

  const startScan = useCallback(async () => {
    setRefreshing(true)

    await checkPermission()

    sub.current = new Observable<LedgerDetails>(TransportBLE.listen).subscribe({
      complete: () => {
        setRefreshing(false)
      },
      next: (e) => {
        if (e.type === 'add') {
          maybeAddDevice(e.descriptor)
        }
        setRefreshing(false)
      },
      error: (err) => {
        Logger.error(err)
        setError(err)
        setRefreshing(false)
      },
    })
  }, [maybeAddDevice])

  const reload = useCallback(() => {
    if (sub.current) {
      sub.current.unsubscribe()
    }

    setRefreshing(false)
    startScan()
  }, [startScan])

  useAsync(async () => {
    let previousAvailable: boolean | undefined
    new Observable<LedgerAvailable>(TransportBLE.observeState).subscribe(
      (e) => {
        if (e.available !== previousAvailable) {
          previousAvailable = e.available
          if (e.available) {
            reload()
          } else if (!e.available && e.type) {
            setError(new Error(e.type))
          }
        }
      },
    )
    return () => {
      if (sub.current) {
        sub.current.unsubscribe()
      }
    }
  }, [])

  return { startScan, refreshing, error, devices, setError, reload }
}

export default useDeviceScan
