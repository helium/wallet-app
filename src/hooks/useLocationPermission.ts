import { useEffect, useState } from 'react'
import { Platform, Linking } from 'react-native'
import { 
  PERMISSIONS, 
  RESULTS, 
  PermissionStatus, 
  Permission,
  checkMultiple,
  requestMultiple,
} from 'react-native-permissions'
import useAlert from './useAlert'
import * as Logger from '../utils/logger'

export const useLocationPermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean>(false)
  const { showOKCancelAlert } = useAlert()

  useEffect(() => {
    const updatePermissionStatus = (status: PermissionStatus) => {
      switch (status) {
        case RESULTS.GRANTED:
          setHasPermission(true)
          break
        case RESULTS.UNAVAILABLE:
          // Show alert to enable location services
          showOKCancelAlert({
            title: 'Location Services Disabled',
            message: 'Please enable location services in your device settings to use this feature',
            ok: 'Open Settings',
          }).then((decision) => {
            if (decision) {
              Linking.openSettings()
            }
          })
          setHasPermission(false)
          break
        case RESULTS.DENIED:
        case RESULTS.BLOCKED:
        case RESULTS.LIMITED:
          setHasPermission(false)
          break
      }
    }

    const checkPermission = async () => {
      try {
        if (Platform.OS === 'ios') {
          const permissions = [PERMISSIONS.IOS.LOCATION_WHEN_IN_USE]
          const statuses = await checkMultiple(permissions)
          const status = statuses[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE]
          console.log('status', status)
          updatePermissionStatus(status)

          if (status === RESULTS.DENIED) {
            const requestStatuses = await requestMultiple(permissions)
            const requestStatus = requestStatuses[PERMISSIONS.IOS.LOCATION_WHEN_IN_USE]
            updatePermissionStatus(requestStatus)
          } else if (status === RESULTS.BLOCKED) {
            const decision = await showOKCancelAlert({
              title: 'Location Permission Required',
              message: 'Please enable location services to use this feature',
              ok: 'Open Settings',
            })

            if (decision) {
              Linking.openSettings()
            }
          }
        } else {
          // Android needs both FINE and COARSE location
          const permissions = [
            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
            PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
          ]
          const statuses = await checkMultiple(permissions)

          // If any permission is granted, we can proceed
          if (Object.values(statuses).includes(RESULTS.GRANTED)) {
            updatePermissionStatus(RESULTS.GRANTED)
          } else if (Object.values(statuses).includes(RESULTS.DENIED)) {
            const requestStatuses = await requestMultiple(permissions)

            // If any permission is granted after request, we can proceed
            if (Object.values(requestStatuses).includes(RESULTS.GRANTED)) {
              updatePermissionStatus(RESULTS.GRANTED)
            } else {
              updatePermissionStatus(RESULTS.DENIED)
            }
          } else if (Object.values(statuses).includes(RESULTS.BLOCKED)) {
            const decision = await showOKCancelAlert({
              title: 'Location Permission Required',
              message: 'Please enable location services to use this feature',
              ok: 'Open Settings',
            })

            if (decision) {
              Linking.openSettings()
            }
          }
        }
      } catch (error) {
        Logger.error(error)
        setHasPermission(false)
      }
    }

    checkPermission()
  }, [showOKCancelAlert])

  return { hasPermission }
}
