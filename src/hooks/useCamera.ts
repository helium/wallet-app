import { useState, useEffect } from 'react'
import { Camera } from 'expo-camera'

const useCamera = () => {
  const [hasPermission, setHasPermission] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  return { hasPermission }
}

export default useCamera
