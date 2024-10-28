import { Platform } from 'react-native'
import {
  check,
  request,
  PERMISSIONS,
  PermissionStatus,
} from 'react-native-permissions'

export const getCameraPermissionStatus =
  async (): Promise<PermissionStatus> => {
    try {
      if (Platform.OS === 'android') {
        return await check(PERMISSIONS.ANDROID.CAMERA)
      }

      return await check(PERMISSIONS.IOS.CAMERA)
    } catch {
      return 'unavailable'
    }
  }

export const requestCameraPermission = async (): Promise<PermissionStatus> => {
  try {
    if (Platform.OS === 'android') {
      return await request(PERMISSIONS.ANDROID.CAMERA)
    }

    return await request(PERMISSIONS.IOS.CAMERA)
  } catch {
    return 'unavailable'
  }
}
