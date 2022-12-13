import { useNavigation } from '@react-navigation/native'
import { useEffect } from 'react'
import { useAppState } from '@react-native-community/hooks'
import { useDebouncedCallback } from 'use-debounce'
import usePrevious from './usePrevious'

type AppearProps = () => void

const useAppear = (callback: AppearProps) => {
  const navigation = useNavigation()
  const appState = useAppState()
  const prevAppState = usePrevious(appState)

  const handleCallback = useDebouncedCallback(() => callback(), 1000, {
    leading: true,
    trailing: false,
  })

  useEffect(() => {
    if (appState === 'active' && appState !== prevAppState) {
      handleCallback()
    }
  }, [appState, handleCallback, prevAppState])

  useEffect(
    () => navigation.addListener('focus', () => handleCallback()),
    [callback, handleCallback, navigation],
  )
}

export default useAppear
