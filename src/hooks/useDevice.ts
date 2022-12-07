import { useMemo } from 'react'
import { getVersion } from 'react-native-device-info'

export const useAppVersion = () => useMemo(() => getVersion(), [])
